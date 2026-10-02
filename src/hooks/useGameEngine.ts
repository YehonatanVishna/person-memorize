import { useCallback, useState } from 'react';
import type { ConcreteGameMode, GameMode, GameSettings, GameSummary, MistakeRecord, Person, QuestionRecord } from '../types/person';
import {
  buildQuestionQueue,
  createMistakeRecord,
  evaluateAnswer,
  generateQuestionOptions,
  type RoundEvaluation,
  type RoundStatus,
} from '../utils/gameEngine';
import { triggerCorrectAnswerConfetti } from '../utils/confetti';

export interface UseGameEngineReturn {
  status: RoundStatus;
  mode: GameMode;
  currentMode: ConcreteGameMode;
  settings: GameSettings;
  currentPerson: Person | null;
  currentRecord: QuestionRecord | null;
  currentOptions: Person[];
  currentIndex: number;
  totalQuestions: number;
  progressPercentage: number;
  score: number;
  streak: number;
  highestStreak: number;
  lastEvaluation: RoundEvaluation | null;
  summary: GameSummary | null;
  startGame: (mode: GameMode, pool: Person[], settings: GameSettings, customQueue?: QuestionRecord[]) => void;
  submitAnswer: (answer: string) => void;
  nextQuestion: () => void;
  retryMistakes: () => void;
  resetGame: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  questionCount: -1,
  allowTypo: true,
  shuffleQuestions: true,
};

export function useGameEngine(): UseGameEngineReturn {
  const [status, setStatus] = useState<RoundStatus>('idle');
  const [mode, setMode] = useState<GameMode>('photo-to-name');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [pool, setPool] = useState<Person[]>([]);
  const [queue, setQueue] = useState<QuestionRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentOptions, setCurrentOptions] = useState<Person[]>([]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<RoundEvaluation | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);

  const startGame = useCallback(
    (
      newMode: GameMode,
      activePool: Person[],
      customSettings: GameSettings = DEFAULT_SETTINGS,
      customQueue?: QuestionRecord[]
    ) => {
      if (!activePool || activePool.length === 0) return;

      const preparedQueue =
        customQueue && customQueue.length > 0
          ? customQueue
          : buildQuestionQueue(activePool, customSettings.questionCount, customSettings.shuffleQuestions, newMode);

      if (preparedQueue.length === 0) return;

      const firstTarget = preparedQueue[0].person;
      const initialOptions = generateQuestionOptions(firstTarget, activePool, 3);

      setMode(newMode);
      setPool(activePool);
      setSettings(customSettings);
      setQueue(preparedQueue);
      setCurrentIndex(0);
      setCurrentOptions(initialOptions);
      setScore(0);
      setStreak(0);
      setHighestStreak(0);
      setMistakes([]);
      setLastEvaluation(null);
      setSummary(null);
      setStartTime(Date.now());
      setStatus('pending');
    },
    []
  );

  const submitAnswer = useCallback(
    (answer: string) => {
      if (status !== 'pending' || queue.length === 0) return;

      const currentRecord = queue[currentIndex];
      const target = currentRecord.person;
      const activeMode = currentRecord.mode;

      const evaluation = evaluateAnswer(activeMode, target, answer, settings.allowTypo, currentOptions);

      setLastEvaluation(evaluation);
      setStatus('feedback');

      if (evaluation.isCorrect) {
        triggerCorrectAnswerConfetti();
        setScore((prev) => prev + 1);
        setStreak((prev) => {
          const nextStreak = prev + 1;
          setHighestStreak((h) => Math.max(h, nextStreak));
          return nextStreak;
        });
      } else {
        setStreak(0);
      }

      const mistake = createMistakeRecord(target, activeMode, evaluation);
      if (mistake) {
        setMistakes((prev) => [...prev, mistake]);
      }
    },
    [status, queue, currentIndex, settings.allowTypo, currentOptions]
  );

  const nextQuestion = useCallback(() => {
    if (status !== 'feedback') return;

    const nextIdx = currentIndex + 1;

    if (nextIdx >= queue.length) {
      // Completed session
      const now = Date.now();
      const durationSeconds = startTime ? Math.round((now - startTime) / 1000) : 0;
      const finalScorePercentage = queue.length > 0 ? Math.round((score / queue.length) * 100) : 0;

      const finalSummary: GameSummary = {
        mode,
        totalQuestions: queue.length,
        correctCount: score,
        scorePercentage: finalScorePercentage,
        streak,
        highestStreak,
        mistakes,
        durationSeconds,
      };

      setSummary(finalSummary);
      setStatus('completed');
    } else {
      // Advance to next question
      const nextTarget = queue[nextIdx].person;
      const nextOptions = generateQuestionOptions(nextTarget, pool, 3);

      setCurrentIndex(nextIdx);
      setCurrentOptions(nextOptions);
      setLastEvaluation(null);
      setStatus('pending');
    }
  }, [status, currentIndex, queue, startTime, score, mode, streak, highestStreak, mistakes, pool]);

  const retryMistakes = useCallback(() => {
    if (!summary || summary.mistakes.length === 0) return;
    const missedRecords: QuestionRecord[] = summary.mistakes.map((m) => ({
      person: m.person,
      mode: m.mode,
    }));
    startGame(mode, pool, settings, missedRecords);
  }, [summary, mode, pool, settings, startGame]);

  const resetGame = useCallback(() => {
    setStatus('idle');
    setSummary(null);
    setLastEvaluation(null);
    setQueue([]);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
  }, []);

  const currentRecord = queue[currentIndex] || null;
  const currentPerson = currentRecord ? currentRecord.person : null;
  const currentMode = currentRecord ? currentRecord.mode : (mode === 'mix' ? 'photo-to-name' : mode);
  const totalQuestions = queue.length;
  const progressPercentage = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  return {
    status,
    mode,
    currentMode,
    settings,
    currentPerson,
    currentRecord,
    currentOptions,
    currentIndex,
    totalQuestions,
    progressPercentage,
    score,
    streak,
    highestStreak,
    lastEvaluation,
    summary,
    startGame,
    submitAnswer,
    nextQuestion,
    retryMistakes,
    resetGame,
  };
}
