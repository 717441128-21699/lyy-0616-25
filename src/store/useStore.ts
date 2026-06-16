import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Deck,
  WordProgress,
  AppState,
  UserSettings,
  UserProgress,
  ReviewResult,
  Word,
  StudyMode,
  TodayPlan,
  DailyReviewLog,
} from '../types';
import { builtinDecks, createCustomDeck } from '../data/decks';
import {
  initializeWordProgress,
  calculateNextReview,
  mapResultToQuality,
  generateTodayPlan,
  getTodayQueue,
  formatDate,
  daysBetween,
  getIntensiveWords,
} from '../utils/spacedRepetition';

interface StoreState extends AppState {
  setCurrentDeck: (deckId: string) => void;
  addCustomDeck: (name: string, words: Word[]) => void;
  removeDeck: (deckId: string) => void;
  updateDeckWord: (deckId: string, wordId: string, updates: Partial<Word>) => void;
  deleteDeckWords: (deckId: string, wordIds: string[]) => void;
  addDeckWord: (deckId: string, word: Word) => void;
  reviewWord: (wordId: string, result: ReviewResult, responseTime: number, mode: StudyMode | 'retry') => void;
  addDailyReviewLog: (log: Omit<DailyReviewLog, 'id' | 'timestamp'>) => void;
  addWordToIntensive: (wordId: string) => void;
  updateWordNotes: (wordId: string, notes: string) => void;
  updateWordMnemonic: (wordId: string, mnemonic: string) => void;
  toggleWordStarred: (wordId: string) => void;
  regenerateTodayPlan: () => void;
  adjustTodayPlanLimit: (type: 'new' | 'review' | 'intensive', delta: number) => void;
  setCurrentMode: (mode: StudyMode) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  syncData: (data?: Partial<AppState>) => Partial<AppState> | null;
  getExportData: () => string;
  importData: (dataString: string) => boolean;
  getCurrentDeck: () => Deck | null;
  getWordById: (wordId: string) => Word | null;
  getWordProgress: (wordId: string) => WordProgress;
  getCurrentQueue: () => string[];
  getIntensiveQueue: () => string[];
}

const generateDeviceId = (): string => {
  return 'device-' + Math.random().toString(36).substr(2, 9);
};

const generateLogId = (): string => {
  return 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
};

const emptyPlan: TodayPlan = {
  newWords: [],
  reviewWords: [],
  intensiveWords: [],
  newWordsLimit: 10,
  reviewWordsLimit: 20,
  intensiveWordsLimit: 15,
};

const getInitialState = (): AppState => {
  return {
    decks: builtinDecks,
    currentDeckId: builtinDecks[0]?.id || null,
    wordProgress: {},
    userSettings: {
      dailyNewWords: 10,
      dailyReviewWords: 20,
      dailyIntensiveWords: 15,
      autoPlayAudio: true,
      darkMode: false,
      syncEnabled: false,
      syncDeviceId: generateDeviceId(),
      lastSyncTime: null,
    },
    userProgress: {
      streakDays: 0,
      lastStudyDate: null,
      totalWordsLearned: 0,
      totalReviews: 0,
      totalIntensiveReviews: 0,
      masteryRate: 0,
      dailyStats: [],
    },
    todayPlan: emptyPlan,
    completedToday: [],
    completedIntensiveToday: [],
    dailyReviewLogs: [],
    currentMode: 'normal',
  };
};

const updateStreak = (progress: UserProgress): UserProgress => {
  const today = formatDate(new Date());
  const lastDate = progress.lastStudyDate;

  if (lastDate === today) {
    return progress;
  }

  let streakDays = progress.streakDays;

  if (lastDate) {
    const daysDiff = daysBetween(lastDate, today);
    if (daysDiff === 1) {
      streakDays += 1;
    } else if (daysDiff > 1) {
      streakDays = 1;
    }
  } else {
    streakDays = 1;
  }

  return {
    ...progress,
    streakDays,
    lastStudyDate: today,
  };
};

const updateDailyStats = (
  progress: UserProgress,
  isNew: boolean,
  correct: boolean,
  timeSpent: number,
  mode: StudyMode
): UserProgress => {
  const today = formatDate(new Date());
  const existingStats = progress.dailyStats.find((s) => s.date === today);

  let dailyStats;

  if (existingStats) {
    dailyStats = progress.dailyStats.map((s) => {
      if (s.date === today) {
        const totalNormal = s.wordsReviewed;
        const totalReviews = totalNormal + s.intensiveReviewed;
        const newTotal = totalReviews + 1;
        return {
          ...s,
          newWordsLearned: isNew ? s.newWordsLearned + 1 : s.newWordsLearned,
          wordsReviewed: mode === 'normal' ? s.wordsReviewed + 1 : s.wordsReviewed,
          intensiveReviewed: mode === 'intensive' ? s.intensiveReviewed + 1 : s.intensiveReviewed,
          correctRate: correct
            ? (s.correctRate * totalReviews + 1) / newTotal
            : (s.correctRate * totalReviews) / newTotal,
          totalTimeSpent: s.totalTimeSpent + timeSpent,
        };
      }
      return s;
    });
  } else {
    dailyStats = [
      ...progress.dailyStats.slice(-29),
      {
        date: today,
        newWordsLearned: isNew ? 1 : 0,
        wordsReviewed: mode === 'normal' ? 1 : 0,
        intensiveReviewed: mode === 'intensive' ? 1 : 0,
        correctRate: correct ? 1 : 0,
        totalTimeSpent: timeSpent,
      },
    ];
  }

  return { ...progress, dailyStats };
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setCurrentDeck: (deckId: string) => {
        set({ currentDeckId: deckId });
        get().regenerateTodayPlan();
      },

      addCustomDeck: (name: string, words: Word[]) => {
        const deck = createCustomDeck(name, words);
        set((state) => ({
          decks: [...state.decks, deck],
        }));
      },

      removeDeck: (deckId: string) => {
        set((state) => {
          const decks = state.decks.filter((d) => d.id !== deckId);
          const currentDeckId = state.currentDeckId === deckId
            ? decks[0]?.id || null
            : state.currentDeckId;
          return { decks, currentDeckId };
        });
      },

      updateDeckWord: (deckId: string, wordId: string, updates: Partial<Word>) => {
        set((state) => {
          const decks = state.decks.map((deck) => {
            if (deck.id !== deckId) return deck;
            return {
              ...deck,
              words: deck.words.map((w) =>
                w.id === wordId ? { ...w, ...updates } : w
              ),
              wordCount: deck.words.length,
            };
          });
          return { decks };
        });
      },

      deleteDeckWords: (deckId: string, wordIds: string[]) => {
        const toDelete = new Set(wordIds);
        set((state) => {
          const decks = state.decks.map((deck) => {
            if (deck.id !== deckId) return deck;
            const newWords = deck.words.filter((w) => !toDelete.has(w.id));
            return {
              ...deck,
              words: newWords,
              wordCount: newWords.length,
            };
          });
          return { decks };
        });
      },

      addDeckWord: (deckId: string, word: Word) => {
        set((state) => {
          const decks = state.decks.map((deck) => {
            if (deck.id !== deckId) return deck;
            const newWords = [...deck.words, word];
            return {
              ...deck,
              words: newWords,
              wordCount: newWords.length,
            };
          });
          return { decks };
        });
      },

      addDailyReviewLog: (log) => {
        set((state) => ({
          dailyReviewLogs: [
            ...state.dailyReviewLogs,
            {
              ...log,
              id: generateLogId(),
              timestamp: Date.now(),
            },
          ],
        }));
      },

      addWordToIntensive: (wordId: string) => {
        set((state) => {
          const progress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          if (progress.isStarred) return state;
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...progress, isStarred: true },
            },
          };
        });
      },

      reviewWord: (wordId: string, result: ReviewResult, responseTime: number, mode: StudyMode | 'retry' = 'normal') => {
        const quality = mapResultToQuality(result);
        const correct = result !== 'forgot';
        const actualMode: StudyMode = mode === 'retry' ? 'normal' : mode;

        set((state) => {
          const existingProgress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          const isNew = existingProgress.repetitions === 0;
          const newProgress = calculateNextReview(existingProgress, quality, responseTime, actualMode);

          let userProgress = state.userProgress;
          if (mode !== 'retry') {
            userProgress = updateDailyStats(
              updateStreak(state.userProgress),
              isNew,
              correct,
              responseTime,
              actualMode
            );
          }

          const allProgress = {
            ...state.wordProgress,
            [wordId]: newProgress,
          };

          const totalWordsLearned = Object.values(allProgress).filter(
            (p) => p.repetitions > 0
          ).length;

          const masteredCount = Object.values(allProgress).filter(
            (p) => p.proficiency === 'mastered'
          ).length;

          const masteryRate = totalWordsLearned > 0 ? masteredCount / totalWordsLearned : 0;

          const completedToday = (mode === 'normal' && !state.completedToday.includes(wordId))
            ? [...state.completedToday, wordId]
            : state.completedToday;

          const completedIntensiveToday = (mode === 'intensive' && !state.completedIntensiveToday.includes(wordId))
            ? [...state.completedIntensiveToday, wordId]
            : state.completedIntensiveToday;

          const newLog: DailyReviewLog = {
            id: generateLogId(),
            wordId,
            result,
            mode,
            timestamp: Date.now(),
            responseTime,
          };

          const addReviews = mode !== 'retry' ? 1 : 0;

          return {
            wordProgress: allProgress,
            userProgress: {
              ...userProgress,
              totalWordsLearned,
              totalReviews: state.userProgress.totalReviews + (mode === 'normal' ? addReviews : 0),
              totalIntensiveReviews: state.userProgress.totalIntensiveReviews + (mode === 'intensive' ? addReviews : 0),
              masteryRate,
            },
            completedToday,
            completedIntensiveToday,
            dailyReviewLogs: [...state.dailyReviewLogs, newLog],
          };
        });
      },

      updateWordNotes: (wordId: string, notes: string) => {
        set((state) => {
          const progress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...progress, notes },
            },
          };
        });
      },

      updateWordMnemonic: (wordId: string, mnemonic: string) => {
        set((state) => {
          const progress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...progress, mnemonic },
            },
          };
        });
      },

      toggleWordStarred: (wordId: string) => {
        set((state) => {
          const progress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...progress, isStarred: !progress.isStarred },
            },
          };
        });
      },

      regenerateTodayPlan: () => {
        const state = get();
        const deck = state.getCurrentDeck();
        if (!deck) return;

        const plan = generateTodayPlan(
          state.wordProgress,
          deck.words,
          state.todayPlan.newWordsLimit || state.userSettings.dailyNewWords,
          state.todayPlan.reviewWordsLimit || state.userSettings.dailyReviewWords,
          state.todayPlan.intensiveWordsLimit || state.userSettings.dailyIntensiveWords,
          state.completedToday
        );

        set({ todayPlan: plan });
      },

      adjustTodayPlanLimit: (type: 'new' | 'review' | 'intensive', delta: number) => {
        const state = get();
        const deck = state.getCurrentDeck();
        if (!deck) return;

        const newLimit = Math.max(0, Math.min(200, (() => {
          switch (type) {
            case 'new':
              return (state.todayPlan.newWordsLimit || state.userSettings.dailyNewWords) + delta;
            case 'review':
              return (state.todayPlan.reviewWordsLimit || state.userSettings.dailyReviewWords) + delta;
            case 'intensive':
              return (state.todayPlan.intensiveWordsLimit || state.userSettings.dailyIntensiveWords) + delta;
          }
        })()));

        const plan = generateTodayPlan(
          state.wordProgress,
          deck.words,
          type === 'new' ? newLimit : state.todayPlan.newWordsLimit,
          type === 'review' ? newLimit : state.todayPlan.reviewWordsLimit,
          type === 'intensive' ? newLimit : state.todayPlan.intensiveWordsLimit,
          state.completedToday
        );

        set({ todayPlan: plan });
      },

      setCurrentMode: (mode: StudyMode) => {
        set({ currentMode: mode });
      },

      updateSettings: (settings: Partial<UserSettings>) => {
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        }));
      },

      syncData: (data?: Partial<AppState>): Partial<AppState> | null => {
        const state = get();

        if (data) {
          const lastSyncTime = state.userSettings.lastSyncTime;
          const dataLastSync = data.userSettings?.lastSyncTime;

          if (!dataLastSync || (lastSyncTime && dataLastSync < lastSyncTime)) {
            return {
              decks: state.decks,
              wordProgress: state.wordProgress,
              userProgress: state.userProgress,
              userSettings: state.userSettings,
            };
          }

          set((state) => ({
            decks: data.decks || state.decks,
            wordProgress: data.wordProgress || state.wordProgress,
            userProgress: data.userProgress || state.userProgress,
            userSettings: {
              ...state.userSettings,
              ...data.userSettings,
              lastSyncTime: formatDate(new Date()),
            },
          }));

          setTimeout(() => get().regenerateTodayPlan(), 0);

          return null;
        }

        return {
          decks: state.decks,
          wordProgress: state.wordProgress,
          userProgress: state.userProgress,
          userSettings: {
            ...state.userSettings,
            lastSyncTime: formatDate(new Date()),
          },
        };
      },

      getExportData: (): string => {
        const state = get();
        const exportData = {
          decks: state.decks.filter((d) => d.category === 'custom'),
          wordProgress: state.wordProgress,
          userProgress: state.userProgress,
          userSettings: state.userSettings,
          completedToday: state.completedToday,
          completedIntensiveToday: state.completedIntensiveToday,
          dailyReviewLogs: state.dailyReviewLogs,
          exportTime: new Date().toISOString(),
          version: '2.0',
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: (dataString: string): boolean => {
        try {
          const data = JSON.parse(dataString);
          const state = get();

          const customDecks = (data.decks || []).filter((d: Deck) => d.category === 'custom');
          const existingDeckIds = new Set(state.decks.map((d) => d.id));
          const newDecks = customDecks.filter((d: Deck) => !existingDeckIds.has(d.id));

          set((state) => ({
            decks: [...state.decks, ...newDecks],
            wordProgress: { ...state.wordProgress, ...data.wordProgress },
            userProgress: data.userProgress || state.userProgress,
            userSettings: { ...state.userSettings, ...data.userSettings },
            completedToday: data.completedToday || state.completedToday,
            completedIntensiveToday: data.completedIntensiveToday || state.completedIntensiveToday,
            dailyReviewLogs: data.dailyReviewLogs || state.dailyReviewLogs,
          }));

          setTimeout(() => get().regenerateTodayPlan(), 0);
          return true;
        } catch (e) {
          console.error('Import failed:', e);
          return false;
        }
      },

      getCurrentDeck: (): Deck | null => {
        const state = get();
        return state.decks.find((d) => d.id === state.currentDeckId) || null;
      },

      getWordById: (wordId: string): Word | null => {
        const state = get();
        for (const deck of state.decks) {
          const word = deck.words.find((w) => w.id === wordId);
          if (word) return word;
        }
        return null;
      },

      getWordProgress: (wordId: string): WordProgress => {
        const state = get();
        return state.wordProgress[wordId] || initializeWordProgress(wordId);
      },

      getCurrentQueue: (): string[] => {
        const state = get();
        const queue = getTodayQueue(state.todayPlan);
        return queue.filter((id) => !state.completedToday.includes(id));
      },

      getIntensiveQueue: (): string[] => {
        const state = get();
        const deck = state.getCurrentDeck();
        if (!deck) return [];

        const intensive = state.todayPlan.intensiveWords.length > 0
          ? state.todayPlan.intensiveWords
          : getIntensiveWords(
              state.wordProgress,
              deck.words,
              state.userSettings.dailyIntensiveWords,
              state.completedIntensiveToday
            );

        return intensive.filter((id) => !state.completedIntensiveToday.includes(id));
      },
    }),
    {
      name: 'vocab-memory-storage-v2',
      partialize: (state) => ({
        decks: state.decks,
        currentDeckId: state.currentDeckId,
        wordProgress: state.wordProgress,
        userSettings: state.userSettings,
        userProgress: state.userProgress,
        completedToday: state.completedToday,
        completedIntensiveToday: state.completedIntensiveToday,
        todayPlan: state.todayPlan,
        dailyReviewLogs: state.dailyReviewLogs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const today = formatDate(new Date());
          const lastStudyDate = state.userProgress.lastStudyDate;

          if (lastStudyDate !== today) {
            state.completedToday = [];
            state.completedIntensiveToday = [];
            state.dailyReviewLogs = [];
            state.currentMode = 'normal';
            state.todayPlan = {
              ...emptyPlan,
              newWordsLimit: state.userSettings.dailyNewWords,
              reviewWordsLimit: state.userSettings.dailyReviewWords,
              intensiveWordsLimit: state.userSettings.dailyIntensiveWords,
            };
          }

          setTimeout(() => {
            state.regenerateTodayPlan?.();
          }, 0);
        }
      },
    }
  )
);
