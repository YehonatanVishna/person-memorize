import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { GameHeader } from './components/GameHeader';
import { TypeAnswerGame } from './components/TypeAnswerGame';
import { MultipleChoiceTextGame } from './components/MultipleChoiceTextGame';
import { MultipleChoicePhotoGame } from './components/MultipleChoicePhotoGame';
import { FlashcardsGame } from './components/FlashcardsGame';
import { GameSummaryModal } from './components/GameSummaryModal';
import { UploadModal } from './components/UploadModal';
import { PeopleDirectoryModal } from './components/PeopleDirectoryModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { useGameEngine } from './hooks/useGameEngine';
import { useFlashcardsEngine } from './hooks/useFlashcardsEngine';
import {
  clearAllPeopleFromStorage,
  deletePersonFromStorage,
  getAllStoredPeople,
  hydrateRuntimePeople,
  savePeopleToStorage,
  updatePersonInStorage,
  cleanupRuntimePeople,
} from './services/storage';
import { getDemoStoredPeople } from './services/demoData';
import type { GameMode, GameSettings, Person, StoredPerson } from './types/person';
import { ShieldCheck, Database, RefreshCw } from 'lucide-react';

export function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    questionCount: -1,
    allowTypo: true,
    shuffleQuestions: true,
  });

  const {
    status,
    mode,
    currentMode,
    currentPerson,
    currentOptions,
    currentIndex,
    totalQuestions,
    score,
    streak,
    lifelines,
    activeHint,
    lastEvaluation,
    summary,
    startGame,
    submitAnswer,
    nextQuestion,
    retryMistakes,
    resetGame,
    useFiftyFifty,
    useHint,
  } = useGameEngine();

  const {
    status: flashcardsStatus,
    currentPerson: flashcardsPerson,
    currentIndex: flashcardsIndex,
    totalCards: flashcardsTotal,
    isFlipped: flashcardsIsFlipped,
    frontSide: flashcardsFrontSide,
    score: flashcardsScore,
    streak: flashcardsStreak,
    summary: flashcardsSummary,
    startFlashcards,
    flipCard,
    toggleFrontSide,
    gradeCard,
    retryMistakes: retryFlashcardsMistakes,
    resetFlashcards,
  } = useFlashcardsEngine();

  const handleResetAll = () => {
    resetGame();
    resetFlashcards();
  };

  // Load existing data from IndexedDB on startup
  const refreshPeople = async () => {
    try {
      const stored = await getAllStoredPeople();
      setPeople((prev) => {
        cleanupRuntimePeople(prev);
        return hydrateRuntimePeople(stored);
      });
    } catch (err) {
      console.error('Error loading people from storage', err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    refreshPeople();
    return () => {
      // cleanup blob URLs on unmount
      setPeople((prev) => {
        cleanupRuntimePeople(prev);
        return [];
      });
    };
  }, []);

  const handleSavePeople = async (newPeople: StoredPerson[], replace: boolean) => {
    if (replace) {
      await clearAllPeopleFromStorage();
    }
    await savePeopleToStorage(newPeople);
    await refreshPeople();
  };

  const handleDeletePerson = async (id: string) => {
    await deletePersonFromStorage(id);
    await refreshPeople();
  };

  const handleUpdatePerson = async (oldId: string, updated: StoredPerson) => {
    await updatePersonInStorage(oldId, updated);
    await refreshPeople();
  };

  const handleClearAll = async () => {
    await clearAllPeopleFromStorage();
    await refreshPeople();
    handleResetAll();
  };

  const handleLoadDemo = async () => {
    const demo = getDemoStoredPeople();
    await savePeopleToStorage(demo);
    await refreshPeople();
  };

  const handleStartMode = (selectedMode: GameMode) => {
    if (people.length === 0) {
      setIsUploadOpen(true);
      return;
    }
    if (selectedMode === 'flashcards') {
      resetGame();
      startFlashcards(people, settings);
    } else {
      resetFlashcards();
      startGame(selectedMode, people, settings);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const isQuizActive = status === 'pending' || status === 'feedback';
  const isFlashcardsActive = flashcardsStatus === 'active';
  const isGameActive = isQuizActive || isFlashcardsActive;
  const isIdle = status === 'idle' && flashcardsStatus === 'idle';

  return (
    <div className="relative min-h-dvh flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl transform-gpu"></div>
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-fuchsia-600/8 rounded-full blur-3xl transform-gpu"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl transform-gpu"></div>
      </div>

      {/* Top Navbar */}
      <Header
        peopleCount={people.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onLoadDemo={handleLoadDemo}
        onGoHome={handleResetAll}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-start sm:justify-center px-3 sm:px-4 py-3 sm:py-8 max-w-5xl mx-auto w-full">
        {isInitializing ? (
          <div className="text-center py-20 text-slate-400 animate-fade-up">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
            <p className="text-sm">טוען נתונים מהמאגר המקומי...</p>
          </div>
        ) : isIdle ? (
          /* Mode Selector & Configuration */
          <div className="animate-fade-up">
            <ModeSelector
              peopleCount={people.length}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onStartMode={handleStartMode}
              onOpenUpload={() => setIsUploadOpen(true)}
              onLoadDemo={handleLoadDemo}
            />
          </div>
        ) : isFlashcardsActive && flashcardsPerson ? (
          /* Active Flashcards Mode */
          <div className="w-full animate-fade-up">
            <GameHeader
              mode="flashcards"
              currentIndex={flashcardsIndex}
              totalQuestions={flashcardsTotal}
              score={flashcardsScore}
              streak={flashcardsStreak}
              onExit={handleResetAll}
            />
            <FlashcardsGame
              key={`${flashcardsPerson.id}-${flashcardsIndex}`}
              person={flashcardsPerson}
              isFlipped={flashcardsIsFlipped}
              frontSide={flashcardsFrontSide}
              onFlip={flipCard}
              onToggleFrontSide={toggleFrontSide}
              onGrade={gradeCard}
            />
          </div>
        ) : isQuizActive && currentPerson ? (
          /* Active Quiz Mode */
          <div className="w-full animate-fade-up">
            <GameHeader
              mode={mode}
              currentMode={currentMode}
              currentIndex={currentIndex}
              totalQuestions={totalQuestions}
              score={score}
              streak={streak}
              onExit={handleResetAll}
            />

            {(currentMode === 'photo-to-name' ||
              currentMode === 'photo-to-first-name' ||
              currentMode === 'photo-to-id-type') && (
              <TypeAnswerGame
                key={`${currentPerson.id}-${currentIndex}`}
                person={currentPerson}
                mode={currentMode}
                status={status}
                lastEvaluation={lastEvaluation}
                lifelines={lifelines}
                activeHint={activeHint}
                onHint={useHint}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
              />
            )}

            {(currentMode === 'name-to-id' || currentMode === 'photo-to-id' || currentMode === 'id-to-name') && (
              <MultipleChoiceTextGame
                key={`${currentPerson.id}-${currentIndex}`}
                person={currentPerson}
                options={currentOptions}
                mode={currentMode}
                status={status}
                lastEvaluation={lastEvaluation}
                lifelines={lifelines}
                activeHint={activeHint}
                onFiftyFifty={useFiftyFifty}
                onHint={useHint}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
              />
            )}

            {(currentMode === 'name-to-photo' || currentMode === 'id-to-photo') && (
              <MultipleChoicePhotoGame
                key={`${currentPerson.id}-${currentIndex}`}
                person={currentPerson}
                options={currentOptions}
                mode={currentMode}
                status={status}
                lastEvaluation={lastEvaluation}
                lifelines={lifelines}
                activeHint={activeHint}
                onFiftyFifty={useFiftyFifty}
                onHint={useHint}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
              />
            )}
          </div>
        ) : flashcardsStatus === 'completed' && flashcardsSummary ? (
          /* Flashcards Session Completed */
          <div className="animate-scale-in">
            <GameSummaryModal
              summary={flashcardsSummary}
              onPlayAgain={() => startFlashcards(people, settings)}
              onRetryMistakes={retryFlashcardsMistakes}
              onGoHome={handleResetAll}
            />
          </div>
        ) : status === 'completed' && summary ? (
          /* Quiz Session Completed & Mistake Review */
          <div className="animate-scale-in">
            <GameSummaryModal
              summary={summary}
              onPlayAgain={() => startGame(mode, people, settings)}
              onRetryMistakes={retryMistakes}
              onGoHome={handleResetAll}
            />
          </div>
        ) : null}
      </main>

      {/* Footer Info - hidden during active game to preserve vertical screen space on mobile */}
      {!isGameActive && (
        <footer className="relative z-10 w-full border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-sm py-4 sm:py-6 px-4 pb-safe text-center text-xs text-slate-500">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>פרטיות מלאה: כל המידע והתמונות נשמרים מקומית בדפדפן בלבד (IndexedDB) ללא שרת חיצוני.</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5" />
              <span>React + Vite + JSZip</span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSavePeople={handleSavePeople}
        onLoadDemo={handleLoadDemo}
      />

      <PeopleDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        people={people}
        onDeletePerson={handleDeletePerson}
        onUpdatePerson={handleUpdatePerson}
        onClearAll={handleClearAll}
      />

      <PlayerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default App;
