import type { ConcreteGameMode, GameMode, MistakeRecord, Person, QuestionRecord } from '../types/person';
import { checkFirstNameMatch, checkNameMatch, getFirstName } from './hebrew';

export type RoundStatus = 'idle' | 'pending' | 'feedback' | 'completed';

export const ALL_CONCRETE_MODES: readonly ConcreteGameMode[] = [
  'photo-to-name',
  'photo-to-first-name',
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
  pointsAwarded?: number;
  speedBonus?: number;
  streakMultiplier?: number;
}

export interface ScoreReward {
  points: number;
  basePoints: number;
  speedBonus: number;
  multiplier: number;
}

/**
 * Robustly extract a 1-9 digit from a keyboard event across all platforms,
 * layouts (including Hebrew keyboards on Mac/Windows/Linux), and NumPads.
 */
export function getNumberFromKeyEvent(e: {
  key?: string;
  code?: string;
  keyCode?: number;
  which?: number;
}): number | null {
  // 1. Direct number key ('1' - '9')
  if (e.key && e.key >= '1' && e.key <= '9') {
    return parseInt(e.key, 10);
  }
  // 2. Physical key codes: Digit1-9, Numpad1-9 (completely layout-agnostic!)
  if (e.code) {
    const match = e.code.match(/^(?:Digit|Numpad)([1-9])$/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  // 3. Hebrew letter shortcuts (א = 1, ב = 2, ג = 3, ד = 4)
  if (e.key === 'א') return 1;
  if (e.key === 'ב') return 2;
  if (e.key === 'ג') return 3;
  if (e.key === 'ד') return 4;

  // 4. Fallback keyCode / which
  const code = e.keyCode || e.which;
  if (code && code >= 49 && code <= 57) {
    return code - 48; // 1-9
  }
  if (code && code >= 97 && code <= 105) {
    return code - 96; // Numpad 1-9
  }
  return null;
}

/**
 * Pure calculation for XP and bonuses per question.
 */
export function calculateScoreReward(
  isCorrect: boolean,
  responseTimeMs: number,
  streak: number,
  isRetry: boolean = false
): ScoreReward {
  if (!isCorrect) {
    return { points: 0, basePoints: 0, speedBonus: 0, multiplier: 1 };
  }

  const basePoints = isRetry ? 50 : 100;

  // Speed bonus: < 2.5s -> +50 XP, < 5s -> +25 XP
  let speedBonus = 0;
  if (responseTimeMs > 0 && responseTimeMs < 2500) {
    speedBonus = isRetry ? 25 : 50;
  } else if (responseTimeMs >= 2500 && responseTimeMs < 5000) {
    speedBonus = isRetry ? 12 : 25;
  }

  // Streak multiplier
  let multiplier = 1.0;
  if (streak >= 10) {
    multiplier = 2.5;
  } else if (streak >= 5) {
    multiplier = 2.0;
  } else if (streak >= 3) {
    multiplier = 1.5;
  }

  const totalPoints = Math.round((basePoints + speedBonus) * multiplier);

  return {
    points: totalPoints,
    basePoints,
    speedBonus,
    multiplier,
  };
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
 * Safely apply 50:50 lifeline to multiple choice options.
 * Guarantees target is preserved and retains at least 1 distractor.
 * If options <= 2, returns options as-is.
 */
export function applyFiftyFifty(target: Person, options: readonly Person[]): Person[] {
  if (options.length <= 2) {
    return [...options];
  }

  const targetPerson = options.find((o) => o.id === target.id) || target;
  const distractors = options.filter((o) => o.id !== target.id);

  if (distractors.length === 0) {
    return [targetPerson];
  }

  // Keep 1 random distractor (giving 2 options total: 1 correct + 1 distractor)
  const shuffledDistractors = shuffle(distractors);
  const keptDistractor = shuffledDistractors[0];

  return shuffle([targetPerson, keptDistractor]);
}

/**
 * Generate an informative hint clue based on the question mode and target person.
 */
export function getHintClue(mode: ConcreteGameMode, target: Person): string {
  switch (mode) {
    case 'photo-to-first-name': {
      const firstName = getFirstName(target.name);
      const firstLetter = firstName.trim()[0] || '';
      return `רמז: השם הפרטי מתחיל באות "${firstLetter}"`;
    }
    case 'photo-to-name': {
      const firstLetter = target.name.trim()[0] || '';
      return `רמז: השם המלא מתחיל באות "${firstLetter}"`;
    }
    case 'photo-to-id-type':
    case 'name-to-id':
    case 'photo-to-id': {
      const cleanDigits = target.id.replace(/\D/g, '');
      const prefix = cleanDigits.slice(0, 3) || target.id.slice(0, 3);
      return `רמז: תעודת הזהות מתחילה בספרות "${prefix}..."`;
    }
    case 'id-to-name': {
      const firstLetter = target.name.trim()[0] || '';
      return `רמז: שם האדם מתחיל באות "${firstLetter}"`;
    }
    case 'name-to-photo':
    case 'id-to-photo': {
      const firstName = getFirstName(target.name);
      return `רמז: חפש את תמונתו של ${firstName}`;
    }
    default:
      return `רמז: השם מתחיל באות "${target.name.trim()[0] || ''}"`;
  }
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

  const concreteMode: ConcreteGameMode =
    sessionMode === 'flashcards' ? 'photo-to-name' : sessionMode;

  return selectedPeople.map((person) => ({
    person,
    mode: concreteMode,
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

  // Mode 1b: Photo -> First Name (free text input for first name only)
  if (mode === 'photo-to-first-name') {
    const firstName = getFirstName(target.name);
    const match = checkFirstNameMatch(answer, target.name, allowTypo);
    return {
      isCorrect: match.isMatch,
      isTypo: match.isTypo,
      userAnswer: answer,
      correctAnswer: firstName,
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
