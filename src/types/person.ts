export interface Person {
  id: string;
  name: string;
  photoBlob: Blob;
  photoUrl: string;
}

export interface StoredPerson {
  id: string;
  name: string;
  photoBlob: Blob;
  createdAt: number;
}

export interface ManifestItem {
  id: string | number;
  name: string;
  photo: string;
}

export type GameMode = 'photo-to-name' | 'name-to-id' | 'name-to-photo';

export interface GameSettings {
  questionCount: number; // e.g. 5, 10, 20, or -1 for all
  allowTypo: boolean;    // Levenshtein typo tolerance in photo-to-name
  shuffleQuestions: boolean;
}

export interface QuestionRecord {
  person: Person;
  options?: (string | Person)[]; // IDs or Persons for multiple choice
}

export interface MistakeRecord {
  person: Person;
  userAnswer: string;
  correctAnswer: string;
  mode: GameMode;
  isTypo?: boolean;
}

export interface GameSummary {
  mode: GameMode;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  streak: number;
  highestStreak: number;
  mistakes: MistakeRecord[];
  durationSeconds: number;
}
