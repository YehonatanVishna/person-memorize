import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { GameHeader } from './components/GameHeader';
import { PhotoToNameGame } from './components/PhotoToNameGame';
import { NameToIdGame } from './components/NameToIdGame';
import { NameToPhotoGame } from './components/NameToPhotoGame';
import { GameSummaryModal } from './components/GameSummaryModal';
import { UploadModal } from './components/UploadModal';
import { PeopleDirectoryModal } from './components/PeopleDirectoryModal';
import { useGameEngine } from './hooks/useGameEngine';
import {
  clearAllPeopleFromStorage,
  deletePersonFromStorage,
  getAllStoredPeople,
  hydrateRuntimePeople,
  savePeopleToStorage,
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
  const [settings, setSettings] = useState<GameSettings>({
    questionCount: -1,
    allowTypo: true,
    shuffleQuestions: true,
  });

  const {
    status,
    mode,
    currentPerson,
    currentOptions,
    currentIndex,
    totalQuestions,
    score,
    streak,
    lastEvaluation,
    summary,
    startGame,
    submitAnswer,
    nextQuestion,
    retryMistakes,
    resetGame,
  } = useGameEngine();

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

  const handleClearAll = async () => {
    await clearAllPeopleFromStorage();
    await refreshPeople();
    resetGame();
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
    startGame(selectedMode, people, settings);
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const isGameActive = status === 'pending' || status === 'feedback';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Top Navbar */}
      <Header
        peopleCount={people.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onLoadDemo={handleLoadDemo}
        onGoHome={resetGame}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-5xl mx-auto w-full">
        {isInitializing ? (
          <div className="text-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
            <p className="text-sm">טוען נתונים מהמאגר המקומי...</p>
          </div>
        ) : status === 'idle' ? (
          /* Mode Selector & Configuration */
          <ModeSelector
            peopleCount={people.length}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onStartMode={handleStartMode}
            onOpenUpload={() => setIsUploadOpen(true)}
            onLoadDemo={handleLoadDemo}
          />
        ) : isGameActive && currentPerson ? (
          /* Active Game Mode */
          <div className="w-full">
            <GameHeader
              mode={mode}
              currentIndex={currentIndex}
              totalQuestions={totalQuestions}
              score={score}
              streak={streak}
              onExit={resetGame}
            />

            {mode === 'photo-to-name' && (
              <PhotoToNameGame
                person={currentPerson}
                status={status}
                lastEvaluation={lastEvaluation}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
              />
            )}

            {mode === 'name-to-id' && (
              <NameToIdGame
                person={currentPerson}
                options={currentOptions}
                status={status}
                lastEvaluation={lastEvaluation}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
              />
            )}

            {mode === 'name-to-photo' && (
              <NameToPhotoGame
                person={currentPerson}
                options={currentOptions}
                status={status}
                lastEvaluation={lastEvaluation}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
              />
            )}
          </div>
        ) : status === 'completed' && summary ? (
          /* Session Completed & Mistake Review */
          <GameSummaryModal
            summary={summary}
            onPlayAgain={() => startGame(mode, people, settings)}
            onRetryMistakes={retryMistakes}
            onGoHome={resetGame}
          />
        ) : null}
      </main>

      {/* Footer Info */}
      <footer className="w-full border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>פרטיות מלאה: כל המידע והתמונות נשמרים מקומית בדפדפן בלבד (IndexedDB) ללא שרת חיצוני.</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5" />
            <span>React + Vite + JSZip</span>
          </div>
        </div>
      </footer>

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
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default App;
