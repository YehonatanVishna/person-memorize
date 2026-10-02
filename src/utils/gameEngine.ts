import type { ConcreteGameMode, GameMode, MistakeRecord, Person, QuestionRecord } from '../types/person';
import { checkNameMatch } from './hebrew';

export type RoundStatus = 'idle' | 'pending' | 'feedback' | 'completed';

export const ALL_CONCRETE_MODES: readonly ConcreteGameMode[] = [
  'photo-to-name',
  'name-to-photo',
  'name-to-id',
  'photo-to-id',
  'id-to-photo',
  'id-to-name',
  'photo-to-id-type',
];

export interface QuestionRound {
  target: Person;
  options: Person[]; // For MC modes
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
  shouldShuffle: boolean = true,
  sessionMode: GameMode = 'photo-to-name'
): QuestionRecord[] {
  if (pool.length === 0) return [];
  const basePool = shouldShuffle ? shuffle(pool) : [...pool];
  const selectedPeople =
    questionCount <= 0 || questionCount >= basePool.length
      ? basePool
      : basePool.slice(0, questionCount);

  if (sessionMode === 'mix') {
    // Distribute modes fairly across the queue
    let modeCycle = shuffle([...ALL_CONCRETE_MODES]);
    return selectedPeople.map((person) => {
      if (modeCycle.length === 0) {
        modeCycle = shuffle([...ALL_CONCRETE_MODES]);
      }
      const mode = modeCycle.pop()!;
      return {
        person,
        mode,
      };
    });
  }

  return selectedPeople.map((person) => ({
    person,
    mode: sessionMode,
  }));
}

/**
 * Evaluate an answer for any concrete game mode.
 */
export function evaluateAnswer(
  mode: ConcreteGameMode,
  target: Person,
  rawAnswer: string,
  allowTypo: boolean = true,
  options?: Person[]
): RoundEvaluation {
  const answer = rawAnswer.trim();

  // Mode 1: Photo -> Name (free text input with Hebrew typo tolerance)
  if (mode === 'photo-to-name') {
    const match = checkNameMatch(answer, target.name, allowTypo);
    return {
      isCorrect: match.isMatch,
      isTypo: match.isTypo,
      userAnswer: answer,
      correctAnswer: target.name,
    };
  }

  // Mode 2: Name -> Photo (2x2 photo grid)
  if (mode === 'name-to-photo') {
    const isCorrect = answer === target.id || answer === target.name;
    const chosenPerson = options?.find((p) => p.id === answer || p.name === answer);
    return {
      isCorrect,
      isTypo: false,
      userAnswer: chosenPerson ? chosenPerson.name : answer,
      correctAnswer: target.name,
    };
  }

  // Mode 3: Name -> ID (multiple choice buttons)
  if (mode === 'name-to-id') {
    const isCorrect = answer === target.id;
    return {
      isCorrect,
      isTypo: false,
      userAnswer: answer,
      correctAnswer: target.id,
    };
  }

  // Mode 4: Photo -> ID (multiple choice buttons)
  if (mode === 'photo-to-id') {
    const isCorrect = answer === target.id;
    return {
      isCorrect,
      isTypo: false,
      userAnswer: answer,
      correctAnswer: target.id,
    };
  }

  // Mode 5: ID -> Photo (2x2 photo grid)
  if (mode === 'id-to-photo') {
    const isCorrect = answer === target.id || answer === target.name;
    const chosenPerson = options?.find((p) => p.id === answer || p.name === answer);
    return {
      isCorrect,
      isTypo: false,
      userAnswer: chosenPerson ? chosenPerson.name : answer,
      correctAnswer: target.name,
    };
  }

  // Mode 6: ID -> Name (multiple choice buttons)
  if (mode === 'id-to-name') {
    const isCorrect = answer === target.id || answer === target.name;
    const chosenPerson = options?.find((p) => p.id === answer || p.name === answer);
    return {
      isCorrect,
      isTypo: false,
      userAnswer: chosenPerson ? chosenPerson.name : answer,
      correctAnswer: target.name,
    };
  }

  // Mode 7: Photo -> ID (free numeric typing)
  if (mode === 'photo-to-id-type') {
    const cleanAnswer = answer.replace(/\D/g, '');
    const cleanTargetId = target.id.replace(/\D/g, '');
    const isCorrect = cleanAnswer.length > 0 && cleanAnswer === cleanTargetId;
    return {
      isCorrect,
      isTypo: false,
      userAnswer: answer,
      correctAnswer: target.id,
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
  mode: ConcreteGameMode,
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
