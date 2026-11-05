import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConcreteGameMode, GameMode, GameSettings, GameSummary, MistakeRecord, Person, QuestionRecord } from '../types/person';
import {
  applyFiftyFifty,
  buildQuestionQueue,
  calculateScoreReward,
  createMistakeRecord,
  evaluateAnswer,
  generateQuestionOptions,
  getHintClue,
  type RoundEvaluation,
  type RoundStatus,
} from '../utils/gameEngine';
import { triggerCorrectAnswerConfetti } from '../utils/confetti';
import {
  playCorrectSound,
  playWrongSound,
  playStreakMilestoneSound,
  playLifelineSound,
} from '../utils/sound';
import { recordSessionCompletion } from '../services/playerProgress';

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
  earnedXP: number;
  multiplier: number;
  lifelines: { fiftyFifty: number; hint: number };
  activeHint: string | null;
  lastEvaluation: RoundEvaluation | null;
  summary: GameSummary | null;
  startGame: (mode: GameMode, pool: Person[], settings: GameSettings, customQueue?: QuestionRecord[]) => void;
  submitAnswer: (answer: string) => void;
  nextQuestion: () => void;
  retryMistakes: () => void;
  resetGame: () => void;
  useFiftyFifty: () => void;
  useHint: () => void;
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
  const [earnedXP, setEarnedXP] = useState<number>(0);
  const [isRetrySession, setIsRetrySession] = useState<boolean>(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [fastestAnswerMs, setFastestAnswerMs] = useState<number>(Infinity);
  const [hasPerfectTyping, setHasPerfectTyping] = useState<boolean>(false);
  const [lifelines, setLifelines] = useState<{ fiftyFifty: number; hint: number }>({ fiftyFifty: 1, hint: 1 });
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<RoundEvaluation | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoNextTimer = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  }, []);

  const nextQuestionRef = useRef<() => void>(() => {});

  const startGame = useCallback(
    (
      newMode: GameMode,
      activePool: Person[],
      customSettings: GameSettings = DEFAULT_SETTINGS,
      customQueue?: QuestionRecord[]
    ) => {
      if (!activePool || activePool.length === 0) return;

      const isRetry = Boolean(customQueue && customQueue.length > 0);
      const preparedQueue =
        isRetry && customQueue
          ? customQueue
          : buildQuestionQueue(activePool, customSettings.questionCount, customSettings.shuffleQuestions, newMode);

      if (preparedQueue.length === 0) return;

      const firstTarget = preparedQueue[0].person;
      const initialOptions = generateQuestionOptions(firstTarget, activePool, 3);
      const now = Date.now();

      setMode(newMode);
      setPool(activePool);
      setSettings(customSettings);
      setQueue(preparedQueue);
      setCurrentIndex(0);
      setCurrentOptions(initialOptions);
      setScore(0);
      setStreak(0);
      setHighestStreak(0);
      setEarnedXP(0);
      setIsRetrySession(isRetry);
      setQuestionStartTime(now);
      setFastestAnswerMs(Infinity);
      setHasPerfectTyping(false);
      setLifelines({ fiftyFifty: 1, hint: 1 });
      setActiveHint(null);
      setMistakes([]);
      setLastEvaluation(null);
      setSummary(null);
      setStartTime(now);
      clearAutoNextTimer();
      setStatus('pending');
    },
    [clearAutoNextTimer]
  );

  const useFiftyFifty = useCallback(() => {
    if (status !== 'pending' || lifelines.fiftyFifty <= 0 || queue.length === 0) return;
    const currentRecord = queue[currentIndex];
    if (!currentRecord) return;

    // 50:50 only applies to multiple choice with >= 3 options
    if (currentOptions.length <= 2) return;

    const reducedOptions = applyFiftyFifty(currentRecord.person, currentOptions);
    setCurrentOptions(reducedOptions);
    setLifelines((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
    playLifelineSound();
  }, [status, lifelines.fiftyFifty, queue, currentIndex, currentOptions]);

  const useHint = useCallback(() => {
    if (status !== 'pending' || lifelines.hint <= 0 || queue.length === 0) return;
    const currentRecord = queue[currentIndex];
    if (!currentRecord) return;

    const clue = getHintClue(currentRecord.mode, currentRecord.person);
    setActiveHint(clue);
    setLifelines((prev) => ({ ...prev, hint: prev.hint - 1 }));
    playLifelineSound();
  }, [status, lifelines.hint, queue, currentIndex]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (status !== 'pending' || queue.length === 0) return;

      const currentRecord = queue[currentIndex];
      const target = currentRecord.person;
      const activeMode = currentRecord.mode;
      const responseTimeMs = questionStartTime > 0 ? Date.now() - questionStartTime : 0;

      const rawEval = evaluateAnswer(activeMode, target, answer, settings.allowTypo, currentOptions);
      const currentNextStreak = rawEval.isCorrect ? streak + 1 : 0;

      const reward = calculateScoreReward(rawEval.isCorrect, responseTimeMs, streak, isRetrySession);

      const evaluation: RoundEvaluation = {
        ...rawEval,
        pointsAwarded: reward.points,
        speedBonus: reward.speedBonus,
        streakMultiplier: reward.multiplier,
      };

      setLastEvaluation(evaluation);
      setStatus('feedback');

      if (evaluation.isCorrect) {
        triggerCorrectAnswerConfetti();
        playCorrectSound(currentNextStreak);

        if (currentNextStreak === 3 || currentNextStreak === 5 || currentNextStreak === 10) {
          playStreakMilestoneSound();
        }

        if (responseTimeMs > 0 && responseTimeMs < 2500) {
          setFastestAnswerMs((prev) => Math.min(prev, responseTimeMs));
        }

        if (
          (activeMode === 'photo-to-name' || activeMode === 'photo-to-first-name' || activeMode === 'photo-to-id-type') &&
          !rawEval.isTypo
        ) {
          setHasPerfectTyping(true);
        }

        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.([30, 20, 30]);
          }
        } catch {
          // ignore
        }

        setScore((prev) => prev + 1);
        setEarnedXP((prev) => prev + reward.points);
        setStreak((prev) => {
          const nextStreak = prev + 1;
          setHighestStreak((h) => Math.max(h, nextStreak));
          return nextStreak;
        });
      } else {
        playWrongSound();
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.(60);
          }
        } catch {
          // ignore
        }
        setStreak(0);
      }

      const mistake = createMistakeRecord(target, activeMode, evaluation);
      if (mistake) {
        setMistakes((prev) => [...prev, mistake]);
      }
    },
    [status, queue, currentIndex, settings.allowTypo, currentOptions, questionStartTime, streak, isRetrySession]
  );

  const nextQuestion = useCallback(() => {
    clearAutoNextTimer();
    if (status !== 'feedback') return;

    const nextIdx = currentIndex + 1;

    if (nextIdx >= queue.length) {
      // Completed session
      const now = Date.now();
      const durationSeconds = startTime ? Math.round((now - startTime) / 1000) : 0;
      const finalScorePercentage = queue.length > 0 ? Math.round((score / queue.length) * 100) : 0;

      // Completion bonus for rounds >= 5 questions
      let sessionXP = earnedXP;
      if (!isRetrySession && queue.length >= 5) {
        sessionXP += 50;
      }

      const finalSummary: GameSummary = {
        mode,
        totalQuestions: queue.length,
        correctCount: score,
        scorePercentage: finalScorePercentage,
        streak,
        highestStreak,
        mistakes,
        durationSeconds,
        xpEarned: sessionXP,
        isRetry: isRetrySession,
      };

      // Record in player progression
      recordSessionCompletion({
        xpEarned: sessionXP,
        correctCount: score,
        totalQuestions: queue.length,
        highestStreak,
        mode,
        isRetry: isRetrySession,
        fastestAnswerMs,
        hasPerfectTyping,
      });

      setSummary(finalSummary);
      setStatus('completed');
    } else {
      // Advance to next question
      const nextTarget = queue[nextIdx].person;
      const nextOptions = generateQuestionOptions(nextTarget, pool, 3);

      setCurrentIndex(nextIdx);
      setCurrentOptions(nextOptions);
      setActiveHint(null);
      setLastEvaluation(null);
      setQuestionStartTime(Date.now());
      setStatus('pending');
    }
  }, [
    status,
    currentIndex,
    queue,
    startTime,
    score,
    mode,
    streak,
    highestStreak,
    mistakes,
    earnedXP,
    isRetrySession,
    fastestAnswerMs,
    hasPerfectTyping,
    pool,
    clearAutoNextTimer,
  ]);

  useEffect(() => {
    nextQuestionRef.current = nextQuestion;
  }, [nextQuestion]);

  // Auto skip to the next question after answering
  useEffect(() => {
    if (status === 'feedback') {
      const isCorrect = lastEvaluation?.isCorrect;
      // Snappy delay: 500ms for correct answers, 900ms for incorrect answers (or instant on any keypress)
      const delay = isCorrect ? 500 : 900;

      autoNextTimerRef.current = setTimeout(() => {
        nextQuestionRef.current();
      }, delay);

      return () => {
        if (autoNextTimerRef.current) {
          clearTimeout(autoNextTimerRef.current);
          autoNextTimerRef.current = null;
        }
      };
    }
  }, [status, currentIndex, lastEvaluation]);

  const retryMistakes = useCallback(() => {
    if (!summary || summary.mistakes.length === 0) return;
    const missedRecords: QuestionRecord[] = summary.mistakes
      .filter((m): m is MistakeRecord & { mode: ConcreteGameMode } => m.mode !== 'flashcards')
      .map((m) => ({
        person: m.person,
        mode: m.mode,
      }));
    startGame(mode, pool, settings, missedRecords);
  }, [summary, mode, pool, settings, startGame]);

  const resetGame = useCallback(() => {
    clearAutoNextTimer();
    setStatus('idle');
    setSummary(null);
    setLastEvaluation(null);
    setQueue([]);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setEarnedXP(0);
    setActiveHint(null);
  }, [clearAutoNextTimer]);

  const currentRecord = queue[currentIndex] || null;
  const currentPerson = currentRecord ? currentRecord.person : null;
  const currentMode = currentRecord
    ? currentRecord.mode
    : mode === 'mix' || mode === 'flashcards'
    ? 'photo-to-name'
    : mode;
  const totalQuestions = queue.length;
  const progressPercentage = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  // Multiplier calculation for UI display
  let multiplier = 1.0;
  if (streak >= 10) multiplier = 2.5;
  else if (streak >= 5) multiplier = 2.0;
  else if (streak >= 3) multiplier = 1.5;

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
    earnedXP,
    multiplier,
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
  };
}
