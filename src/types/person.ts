export interface Person {
  id: string;
  name: string;
  photoBlob: Blob;
  photoUrl: string;
  createdAt?: number;
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

export type ConcreteGameMode =
  | 'photo-to-name'
  | 'name-to-photo'
  | 'name-to-id'
  | 'photo-to-id'
  | 'id-to-photo'
  | 'id-to-name'
  | 'photo-to-id-type';

export type GameMode = ConcreteGameMode | 'mix';

export interface GameSettings {
  questionCount: number; // e.g. 5, 10, 20, or -1 for all
  allowTypo: boolean;    // Levenshtein typo tolerance in name typing
  shuffleQuestions: boolean;
}

export interface QuestionRecord {
  person: Person;
  mode: ConcreteGameMode;
  options?: Person[];
}

export interface MistakeRecord {
  person: Person;
  userAnswer: string;
  correctAnswer: string;
  mode: ConcreteGameMode;
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
