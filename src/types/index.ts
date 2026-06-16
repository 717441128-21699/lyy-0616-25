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
  recentWrong: boolean;
}

export interface ReviewRecord {
  date: string;
  quality: number;
  responseTime: number;
  mode: 'normal' | 'intensive';
}

export type QualityRating = 0 | 3 | 5;

export type ReviewResult = 'forgot' | 'fuzzy' | 'remembered';

export type StudyMode = 'normal' | 'intensive';

export interface Deck {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  category: 'cet4' | 'cet6' | 'ielts' | 'toefl' | 'custom';
  words: Word[];
}

export interface TodayPlan {
  newWords: string[];
  reviewWords: string[];
  intensiveWords: string[];
  newWordsLimit: number;
  reviewWordsLimit: number;
  intensiveWordsLimit: number;
}

export interface UserSettings {
  dailyNewWords: number;
  dailyReviewWords: number;
  dailyIntensiveWords: number;
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
  intensiveReviewed: number;
  correctRate: number;
  totalTimeSpent: number;
}

export interface UserProgress {
  streakDays: number;
  lastStudyDate: string | null;
  totalWordsLearned: number;
  totalReviews: number;
  totalIntensiveReviews: number;
  masteryRate: number;
  dailyStats: DailyStats[];
}

export interface AppState {
  decks: Deck[];
  currentDeckId: string | null;
  wordProgress: Record<string, WordProgress>;
  userSettings: UserSettings;
  userProgress: UserProgress;
  todayPlan: TodayPlan;
  completedToday: string[];
  completedIntensiveToday: string[];
  dailyReviewLogs: DailyReviewLog[];
  currentMode: StudyMode;
}

export interface DailyReviewLog {
  id: string;
  wordId: string;
  result: ReviewResult;
  mode: StudyMode | 'retry';
  timestamp: number;
  responseTime: number;
}

export interface ImportPreviewItem {
  lineNumber: number;
  isValid: boolean;
  errors: string[];
  word?: Word;
  raw: string;
}
