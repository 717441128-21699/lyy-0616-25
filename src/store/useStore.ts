import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deck, WordProgress, AppState, UserSettings, UserProgress, ReviewResult, Word } from '../types';
import { builtinDecks, createCustomDeck } from '../data/decks';
import { initializeWordProgress, calculateNextReview, mapResultToQuality, getWordsForToday, formatDate, daysBetween } from '../utils/spacedRepetition';

interface StoreState extends AppState {
  setCurrentDeck: (deckId: string) => void;
  addCustomDeck: (name: string, words: Word[]) => void;
  removeDeck: (deckId: string) => void;
  reviewWord: (wordId: string, result: ReviewResult, responseTime: number) => void;
  updateWordNotes: (wordId: string, notes: string) => void;
  updateWordMnemonic: (wordId: string, mnemonic: string) => void;
  toggleWordStarred: (wordId: string) => void;
  generateTodayQueue: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  syncData: (data?: Partial<AppState>) => Partial<AppState> | null;
  getExportData: () => string;
  importData: (dataString: string) => boolean;
  getCurrentDeck: () => Deck | null;
  getWordById: (wordId: string) => Word | null;
  getWordProgress: (wordId: string) => WordProgress;
}

const generateDeviceId = (): string => {
  return 'device-' + Math.random().toString(36).substr(2, 9);
};

const getInitialState = (): AppState => {
  return {
    decks: builtinDecks,
    currentDeckId: builtinDecks[0]?.id || null,
    wordProgress: {},
    userSettings: {
      dailyNewWords: 10,
      dailyReviewWords: 20,
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
      masteryRate: 0,
      dailyStats: [],
    },
    todayQueue: [],
    completedToday: [],
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
  timeSpent: number
): UserProgress => {
  const today = formatDate(new Date());
  const existingStats = progress.dailyStats.find(s => s.date === today);
  
  let dailyStats;
  
  if (existingStats) {
    dailyStats = progress.dailyStats.map(s => {
      if (s.date === today) {
        return {
          ...s,
          newWordsLearned: isNew ? s.newWordsLearned + 1 : s.newWordsLearned,
          wordsReviewed: s.wordsReviewed + 1,
          correctRate: correct 
            ? (s.correctRate * s.wordsReviewed + 1) / (s.wordsReviewed + 1)
            : (s.correctRate * s.wordsReviewed) / (s.wordsReviewed + 1),
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
        wordsReviewed: 1,
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
        get().generateTodayQueue();
      },
      
      addCustomDeck: (name: string, words: Word[]) => {
        const deck = createCustomDeck(name, words);
        set(state => ({
          decks: [...state.decks, deck],
        }));
      },
      
      removeDeck: (deckId: string) => {
        set(state => {
          const decks = state.decks.filter(d => d.id !== deckId);
          const currentDeckId = state.currentDeckId === deckId 
            ? decks[0]?.id || null 
            : state.currentDeckId;
          return { decks, currentDeckId };
        });
      },
      
      reviewWord: (wordId: string, result: ReviewResult, responseTime: number) => {
        const quality = mapResultToQuality(result);
        const correct = result !== 'forgot';
        
        set(state => {
          const existingProgress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          const isNew = existingProgress.repetitions === 0;
          const newProgress = calculateNextReview(existingProgress, quality, responseTime);
          
          const userProgress = updateDailyStats(
            updateStreak(state.userProgress),
            isNew,
            correct,
            responseTime
          );
          
          const totalWordsLearned = Object.values(state.wordProgress).filter(
            p => p.repetitions > 0
          ).length + (isNew ? 1 : 0);
          
          const masteredCount = Object.values({
            ...state.wordProgress,
            [wordId]: newProgress,
          }).filter(p => p.proficiency === 'mastered').length;
          
          const masteryRate = totalWordsLearned > 0 ? masteredCount / totalWordsLearned : 0;
          
          const todayQueue = state.todayQueue.filter(id => id !== wordId);
          const completedToday = [...state.completedToday, wordId];
          
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: newProgress,
            },
            userProgress: {
              ...userProgress,
              totalWordsLearned,
              totalReviews: state.userProgress.totalReviews + 1,
              masteryRate,
            },
            todayQueue,
            completedToday,
          };
        });
      },
      
      updateWordNotes: (wordId: string, notes: string) => {
        set(state => {
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
        set(state => {
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
        set(state => {
          const progress = state.wordProgress[wordId] || initializeWordProgress(wordId);
          return {
            wordProgress: {
              ...state.wordProgress,
              [wordId]: { ...progress, isStarred: !progress.isStarred },
            },
          };
        });
      },
      
      generateTodayQueue: () => {
        const state = get();
        const deck = state.getCurrentDeck();
        if (!deck) return;
        
        const queue = getWordsForToday(
          state.wordProgress,
          deck.words,
          state.userSettings.dailyNewWords,
          state.userSettings.dailyReviewWords
        ).filter(id => !state.completedToday.includes(id));
        
        set({ todayQueue: queue });
      },
      
      updateSettings: (settings: Partial<UserSettings>) => {
        set(state => ({
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
          
          set(state => ({
            decks: data.decks || state.decks,
            wordProgress: data.wordProgress || state.wordProgress,
            userProgress: data.userProgress || state.userProgress,
            userSettings: {
              ...state.userSettings,
              ...data.userSettings,
              lastSyncTime: formatDate(new Date()),
            },
          }));
          
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
          decks: state.decks.filter(d => d.category === 'custom'),
          wordProgress: state.wordProgress,
          userProgress: state.userProgress,
          userSettings: state.userSettings,
          exportTime: new Date().toISOString(),
          version: '1.0',
        };
        return JSON.stringify(exportData, null, 2);
      },
      
      importData: (dataString: string): boolean => {
        try {
          const data = JSON.parse(dataString);
          const state = get();
          
          const customDecks = (data.decks || []).filter((d: Deck) => d.category === 'custom');
          const existingDeckIds = new Set(state.decks.map(d => d.id));
          const newDecks = customDecks.filter((d: Deck) => !existingDeckIds.has(d.id));
          
          set(state => ({
            decks: [...state.decks, ...newDecks],
            wordProgress: { ...state.wordProgress, ...data.wordProgress },
            userProgress: data.userProgress || state.userProgress,
            userSettings: { ...state.userSettings, ...data.userSettings },
          }));
          
          get().generateTodayQueue();
          return true;
        } catch (e) {
          console.error('Import failed:', e);
          return false;
        }
      },
      
      getCurrentDeck: (): Deck | null => {
        const state = get();
        return state.decks.find(d => d.id === state.currentDeckId) || null;
      },
      
      getWordById: (wordId: string): Word | null => {
        const state = get();
        for (const deck of state.decks) {
          const word = deck.words.find(w => w.id === wordId);
          if (word) return word;
        }
        return null;
      },
      
      getWordProgress: (wordId: string): WordProgress => {
        const state = get();
        return state.wordProgress[wordId] || initializeWordProgress(wordId);
      },
    }),
    {
      name: 'vocab-memory-storage',
      partialize: (state) => ({
        decks: state.decks,
        currentDeckId: state.currentDeckId,
        wordProgress: state.wordProgress,
        userSettings: state.userSettings,
        userProgress: state.userProgress,
        completedToday: state.completedToday,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const today = formatDate(new Date());
          const lastStudyDate = state.userProgress.lastStudyDate;
          
          if (lastStudyDate !== today) {
            state.completedToday = [];
          }
          
          setTimeout(() => {
            state.generateTodayQueue();
          }, 0);
        }
      },
    }
  )
);
