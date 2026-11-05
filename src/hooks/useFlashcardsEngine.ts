import { useCallback, useState } from 'react';
import type { GameSettings, GameSummary, MistakeRecord, Person } from '../types/person';
import { shuffle } from '../utils/gameEngine';
import { triggerCorrectAnswerConfetti } from '../utils/confetti';

export type FlashcardsStatus = 'idle' | 'active' | 'completed';
export type FlashcardFrontSide = 'photo' | 'details';

export interface UseFlashcardsEngineReturn {
  status: FlashcardsStatus;
  currentPerson: Person | null;
  currentIndex: number;
  totalCards: number;
  progressPercentage: number;
  isFlipped: boolean;
  frontSide: FlashcardFrontSide;
  score: number;
  streak: number;
  highestStreak: number;
  summary: GameSummary | null;
  startFlashcards: (pool: Person[], settings: GameSettings, customCards?: Person[]) => void;
  flipCard: () => void;
  toggleFrontSide: () => void;
  gradeCard: (known: boolean) => void;
  retryMistakes: () => void;
  resetFlashcards: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  questionCount: -1,
  allowTypo: true,
  shuffleQuestions: true,
};

export function useFlashcardsEngine(): UseFlashcardsEngineReturn {
  const [status, setStatus] = useState<FlashcardsStatus>('idle');
  const [pool, setPool] = useState<Person[]>([]);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [cards, setCards] = useState<Person[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [frontSide, setFrontSide] = useState<FlashcardFrontSide>('photo');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);

  const startFlashcards = useCallback(
    (activePool: Person[], customSettings: GameSettings = DEFAULT_SETTINGS, customCards?: Person[]) => {
      if (!activePool || activePool.length === 0) return;

      let selectedCards: Person[];
      if (customCards && customCards.length > 0) {
        selectedCards = customSettings.shuffleQuestions ? shuffle(customCards) : [...customCards];
      } else {
        const basePool = customSettings.shuffleQuestions ? shuffle(activePool) : [...activePool];
        selectedCards =
          customSettings.questionCount <= 0 || customSettings.questionCount >= basePool.length
            ? basePool
            : basePool.slice(0, customSettings.questionCount);
      }

      if (selectedCards.length === 0) return;

      setPool(activePool);
      setSettings(customSettings);
      setCards(selectedCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setScore(0);
      setStreak(0);
      setHighestStreak(0);
      setMistakes([]);
      setSummary(null);
      setStartTime(Date.now());
      setStatus('active');
    },
    []
  );

  const flipCard = useCallback(() => {
    if (status !== 'active') return;
    setIsFlipped((prev) => !prev);
  }, [status]);

  const toggleFrontSide = useCallback(() => {
    setFrontSide((prev) => (prev === 'photo' ? 'details' : 'photo'));
    setIsFlipped(false);
  }, []);

  const gradeCard = useCallback(
    (known: boolean) => {
      if (status !== 'active' || cards.length === 0) return;

      const currentCard = cards[currentIndex];
      const nextScore = known ? score + 1 : score;
      const nextStreak = known ? streak + 1 : 0;
      const nextHighestStreak = Math.max(highestStreak, nextStreak);
      const nextMistakes = known
        ? mistakes
        : [
            ...mistakes,
            {
              person: currentCard,
              userAnswer: 'לא ידעתי',
              correctAnswer: currentCard.name,
              mode: 'flashcards' as const,
            },
          ];

      if (known) {
        triggerCorrectAnswerConfetti();
      }

      setScore(nextScore);
      setStreak(nextStreak);
      setHighestStreak(nextHighestStreak);
      setMistakes(nextMistakes);

      const nextIdx = currentIndex + 1;
      if (nextIdx >= cards.length) {
        const now = Date.now();
        const durationSeconds = startTime ? Math.round((now - startTime) / 1000) : 0;
        const finalScorePercentage = Math.round((nextScore / cards.length) * 100);

        setSummary({
          mode: 'flashcards',
          totalQuestions: cards.length,
          correctCount: nextScore,
          scorePercentage: finalScorePercentage,
          streak: nextStreak,
          highestStreak: nextHighestStreak,
          mistakes: nextMistakes,
          durationSeconds,
        });
        setStatus('completed');
      } else {
        setCurrentIndex(nextIdx);
        setIsFlipped(false);
      }
    },
    [status, cards, currentIndex, score, streak, highestStreak, mistakes, startTime]
  );

  const retryMistakes = useCallback(() => {
    if (!summary || summary.mistakes.length === 0) return;
    const missedPeople = summary.mistakes.map((m) => m.person);
    startFlashcards(pool, settings, missedPeople);
  }, [summary, pool, settings, startFlashcards]);

  const resetFlashcards = useCallback(() => {
    setStatus('idle');
    setSummary(null);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setMistakes([]);
  }, []);

  const currentPerson = cards[currentIndex] || null;
  const totalCards = cards.length;
  const progressPercentage = totalCards > 0 ? Math.round(((currentIndex + 1) / totalCards) * 100) : 0;

  return {
    status,
    currentPerson,
    currentIndex,
    totalCards,
    progressPercentage,
    isFlipped,
    frontSide,
    score,
    streak,
    highestStreak,
    summary,
    startFlashcards,
    flipCard,
    toggleFrontSide,
    gradeCard,
    retryMistakes,
    resetFlashcards,
  };
}
