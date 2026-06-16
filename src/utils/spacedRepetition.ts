import type { WordProgress, QualityRating, ReviewResult, TodayPlan, StudyMode } from '../types';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const daysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const calculateRetrievability = (progress: WordProgress): number => {
  if (!progress.lastReviewDate) return 100;
  
  const today = formatDate(new Date());
  const daysSinceReview = daysBetween(progress.lastReviewDate, today);
  const stability = Math.pow(progress.easeFactor, progress.repetitions) * progress.interval;
  
  const retrievability = Math.exp(-daysSinceReview / stability) * 100;
  return Math.max(0, Math.min(100, retrievability));
};

export const mapResultToQuality = (result: ReviewResult): QualityRating => {
  switch (result) {
    case 'forgot':
      return 0;
    case 'fuzzy':
      return 3;
    case 'remembered':
      return 5;
  }
};

export const getProficiency = (repetitions: number, easeFactor: number): 'new' | 'learning' | 'familiar' | 'mastered' => {
  if (repetitions === 0) return 'new';
  if (repetitions < 3) return 'learning';
  if (easeFactor < 2.5) return 'familiar';
  return 'mastered';
};

export const initializeWordProgress = (wordId: string, isStarred: boolean = false): WordProgress => {
  const today = formatDate(new Date());
  return {
    wordId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: today,
    lastReviewDate: null,
    isStarred,
    notes: '',
    mnemonic: '',
    proficiency: 'new',
    reviewHistory: [],
    recentWrong: false,
  };
};

export const calculateNextReview = (
  progress: WordProgress,
  quality: QualityRating,
  responseTime: number = 5,
  mode: StudyMode = 'normal'
): WordProgress => {
  const today = formatDate(new Date());
  let { easeFactor, interval, repetitions } = progress;
  
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }
  
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  if (quality === 5 && responseTime < 3) {
    interval = Math.round(interval * 1.2);
  }
  
  if (progress.isStarred && quality < 5) {
    interval = Math.max(1, Math.round(interval * 0.7));
  }
  
  const nextDate = addDays(new Date(today), interval);
  const proficiency = getProficiency(repetitions, easeFactor);
  const recentWrong = quality === 0 ? true : quality === 5 ? false : progress.recentWrong;
  
  return {
    ...progress,
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    repetitions,
    nextReviewDate: formatDate(nextDate),
    lastReviewDate: today,
    proficiency,
    recentWrong,
    reviewHistory: [
      ...progress.reviewHistory,
      { date: today, quality, responseTime, mode },
    ].slice(-50),
  };
};

export const isDueForReview = (progress: WordProgress): boolean => {
  const today = formatDate(new Date());
  return progress.nextReviewDate <= today;
};

export const getNewWords = (
  allProgress: Record<string, WordProgress>,
  words: { id: string }[],
  limit: number,
  excludeIds: string[] = []
): string[] => {
  return words
    .filter(w => {
      if (excludeIds.includes(w.id)) return false;
      const progress = allProgress[w.id];
      return !progress || progress.repetitions === 0;
    })
    .slice(0, limit)
    .map(w => w.id);
};

export const getReviewWords = (
  allProgress: Record<string, WordProgress>,
  words: { id: string }[],
  limit: number,
  excludeIds: string[] = []
): string[] => {
  const today = formatDate(new Date());
  
  return words
    .filter(w => {
      if (excludeIds.includes(w.id)) return false;
      const progress = allProgress[w.id];
      if (!progress) return false;
      return progress.repetitions > 0 && progress.nextReviewDate <= today;
    })
    .sort((a, b) => {
      const pa = allProgress[a.id];
      const pb = allProgress[b.id];
      if (pa.isStarred && !pb.isStarred) return -1;
      if (!pa.isStarred && pb.isStarred) return 1;
      return calculateRetrievability(pa) - calculateRetrievability(pb);
    })
    .slice(0, limit)
    .map(w => w.id);
};

export const getIntensiveWords = (
  allProgress: Record<string, WordProgress>,
  words: { id: string }[],
  limit: number,
  excludeIds: string[] = []
): string[] => {
  return words
    .filter(w => {
      if (excludeIds.includes(w.id)) return false;
      const progress = allProgress[w.id];
      if (!progress) return false;
      return progress.isStarred || progress.recentWrong;
    })
    .sort((a, b) => {
      const pa = allProgress[a.id];
      const pb = allProgress[b.id];
      const paScore = (pa.isStarred ? 2 : 0) + (pa.recentWrong ? 1 : 0);
      const pbScore = (pb.isStarred ? 2 : 0) + (pb.recentWrong ? 1 : 0);
      if (paScore !== pbScore) return pbScore - paScore;
      return calculateRetrievability(pa) - calculateRetrievability(pb);
    })
    .slice(0, limit)
    .map(w => w.id);
};

export const generateTodayPlan = (
  allProgress: Record<string, WordProgress>,
  words: { id: string }[],
  newLimit: number,
  reviewLimit: number,
  intensiveLimit: number,
  completedIds: string[] = []
): TodayPlan => {
  const reviewWords = getReviewWords(allProgress, words, reviewLimit, completedIds);
  const newWords = getNewWords(allProgress, words, newLimit, [...completedIds, ...reviewWords]);
  const intensiveWords = getIntensiveWords(allProgress, words, intensiveLimit, completedIds);
  
  return {
    newWords,
    reviewWords,
    intensiveWords,
    newWordsLimit: newLimit,
    reviewWordsLimit: reviewLimit,
    intensiveWordsLimit: intensiveLimit,
  };
};

export const getTodayQueue = (plan: TodayPlan): string[] => {
  const seen = new Set<string>();
  const queue: string[] = [];
  
  for (const id of [...plan.reviewWords, ...plan.newWords]) {
    if (!seen.has(id)) {
      seen.add(id);
      queue.push(id);
    }
  }
  
  return queue;
};

export const predictMemoryCurve = (progress: WordProgress, days: number = 30): number[] => {
  const curve: number[] = [];
  let currentProgress = { ...progress };
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const checkDate = formatDate(addDays(today, i));
    const daysSinceReview = progress.lastReviewDate 
      ? daysBetween(progress.lastReviewDate, checkDate)
      : i;
    
    if (currentProgress.repetitions === 0) {
      curve.push(100);
    } else {
      const stability = Math.pow(currentProgress.easeFactor, currentProgress.repetitions) * currentProgress.interval;
      const retrievability = Math.exp(-daysSinceReview / stability) * 100;
      curve.push(Math.max(0, Math.min(100, retrievability)));
    }
  }
  
  return curve;
};
