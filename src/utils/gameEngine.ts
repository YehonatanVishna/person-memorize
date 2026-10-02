import type { GameMode, MistakeRecord, Person } from '../types/person';
import { checkNameMatch } from './hebrew';

export type RoundStatus = 'idle' | 'pending' | 'feedback' | 'completed';

export interface QuestionRound {
  target: Person;
  options: Person[]; // For MC modes 2 & 3
}

export interface RoundEvaluation {
  isCorrect: boolean;
  isTypo: boolean;
  userAnswer: string;
  correctAnswer: string;
}

/**
 * Immutable Fisher-Yates array shuffle.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Pick random distractors distinct from the target person (filtered by unique ID).
 */
export function getDistractors(target: Person, pool: readonly Person[], maxDistractors: number = 3): Person[] {
  const candidates = pool.filter((p) => p.id !== target.id);
  const shuffledCandidates = shuffle(candidates);
  return shuffledCandidates.slice(0, Math.min(maxDistractors, candidates.length));
}

/**
 * Generate multiple choice options including target and up to 3 distractors, shuffled.
 */
export function generateQuestionOptions(
  target: Person,
  pool: readonly Person[],
  maxDistractors: number = 3
): Person[] {
  const distractorCount = Math.min(maxDistractors, pool.length - 1);
  const distractors = getDistractors(target, pool, distractorCount);
  return shuffle([target, ...distractors]);
}

/**
 * Build the question queue for a session.
 */
export function buildQuestionQueue(
  pool: readonly Person[],
  questionCount: number,
  shouldShuffle: boolean = true
): Person[] {
  if (pool.length === 0) return [];
  const basePool = shouldShuffle ? shuffle(pool) : [...pool];
  if (questionCount <= 0 || questionCount >= basePool.length) {
    return basePool;
  }
  return basePool.slice(0, questionCount);
}

/**
 * Evaluate an answer for any game mode.
 */
export function evaluateAnswer(
  mode: GameMode,
  target: Person,
  rawAnswer: string,
  allowTypo: boolean = true,
  options?: Person[]
): RoundEvaluation {
  const answer = rawAnswer.trim();

  if (mode === 'photo-to-name') {
    const match = checkNameMatch(answer, target.name, allowTypo);
    return {
      isCorrect: match.isMatch,
      isTypo: match.isTypo,
      userAnswer: answer,
      correctAnswer: target.name,
    };
  }

  if (mode === 'name-to-id') {
    const isCorrect = answer === target.id;
    return {
      isCorrect,
      isTypo: false,
      userAnswer: answer,
      correctAnswer: target.id,
    };
  }

  if (mode === 'name-to-photo') {
    const isCorrect = answer === target.id;
    const chosenPerson = options?.find((p) => p.id === answer);
    return {
      isCorrect,
      isTypo: false,
      userAnswer: chosenPerson ? chosenPerson.name : answer,
      correctAnswer: target.name,
    };
  }

  return {
    isCorrect: false,
    isTypo: false,
    userAnswer: answer,
    correctAnswer: '',
  };
}

/**
 * Convert an evaluation to a MistakeRecord if incorrect or typo.
 */
export function createMistakeRecord(
  target: Person,
  mode: GameMode,
  evaluation: RoundEvaluation
): MistakeRecord | null {
  if (evaluation.isCorrect && !evaluation.isTypo) {
    return null;
  }
  return {
    person: target,
    userAnswer: evaluation.userAnswer,
    correctAnswer: evaluation.correctAnswer,
    mode,
    isTypo: evaluation.isTypo,
  };
}
