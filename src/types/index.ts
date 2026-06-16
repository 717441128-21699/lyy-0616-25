export interface Word {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  audioUrl?: string;
}

export interface WordProgress {
  wordId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  isStarred: boolean;
  notes: string;
  mnemonic: string;
  proficiency: 'new' | 'learning' | 'familiar' | 'mastered';
  reviewHistory: ReviewRecord[];
}

export interface ReviewRecord {
  date: string;
  quality: number;
  responseTime: number;
}

export type QualityRating = 0 | 3 | 5;

export type ReviewResult = 'forgot' | 'fuzzy' | 'remembered';

export interface Deck {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  category: 'cet4' | 'cet6' | 'ielts' | 'toefl' | 'custom';
  words: Word[];
}

export interface UserSettings {
  dailyNewWords: number;
  dailyReviewWords: number;
  autoPlayAudio: boolean;
  darkMode: boolean;
  syncEnabled: boolean;
  syncDeviceId: string;
  lastSyncTime: string | null;
}

export interface DailyStats {
  date: string;
  newWordsLearned: number;
  wordsReviewed: number;
  correctRate: number;
  totalTimeSpent: number;
}

export interface UserProgress {
  streakDays: number;
  lastStudyDate: string | null;
  totalWordsLearned: number;
  totalReviews: number;
  masteryRate: number;
  dailyStats: DailyStats[];
}

export interface AppState {
  decks: Deck[];
  currentDeckId: string | null;
  wordProgress: Record<string, WordProgress>;
  userSettings: UserSettings;
  userProgress: UserProgress;
  todayQueue: string[];
  completedToday: string[];
}
