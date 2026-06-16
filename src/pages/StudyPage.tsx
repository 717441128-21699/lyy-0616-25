import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Target, Brain, Minus, Plus, Zap, Trophy, ArrowLeft, BookOpen } from 'lucide-react';
import { WordCard } from '../components/WordCard';
import { useStore } from '../store/useStore';
import type { ReviewResult, StudyMode } from '../types';

interface FeedbackState {
  show: boolean;
  result: ReviewResult;
}

export const StudyPage: React.FC = () => {
  const {
    todayPlan,
    completedToday,
    completedIntensiveToday,
    currentMode,
    userSettings,
    getCurrentQueue,
    getIntensiveQueue,
    getWordById,
    getWordProgress,
    reviewWord,
    adjustTodayPlanLimit,
    setCurrentMode,
    regenerateTodayPlan,
  } = useStore();

  const [feedback, setFeedback] = useState<FeedbackState>({ show: false, result: 'remembered' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    regenerateTodayPlan();
  }, [regenerateTodayPlan]);

  const normalQueue = useMemo(() => getCurrentQueue(), [getCurrentQueue, todayPlan, completedToday]);
  const intensiveQueue = useMemo(() => getIntensiveQueue(), [getIntensiveQueue, todayPlan, completedIntensiveToday]);

  const currentQueue = currentMode === 'intensive' ? intensiveQueue : normalQueue;
  const queueKey = `${currentMode}-${currentQueue.join(',')}`;

  useEffect(() => {
    setCurrentIndex(0);
    setShowCompletion(false);
  }, [queueKey, currentMode]);

  const currentWordId = currentQueue[currentIndex];
  const currentWord = currentWordId ? getWordById(currentWordId) : null;
  const currentProgress = currentWordId ? getWordProgress(currentWordId) : null;

  const totalTasks = todayPlan.reviewWords.length + todayPlan.newWords.length;
  const completedNormal = completedToday.length;

  const handleReview = useCallback((result: ReviewResult) => {
    if (!currentWordId) return;

    const startTime = performance.now();
    const responseTime = Math.round((performance.now() - startTime) / 1000);

    reviewWord(currentWordId, result, responseTime, currentMode);

    setFeedback({ show: true, result });
    setCardKey((k) => k + 1);

    setTimeout(() => {
      setFeedback({ show: false, result: 'remembered' });

      const nextIndex = currentIndex + 1;
      if (nextIndex >= currentQueue.length) {
        setShowCompletion(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 600);
  }, [currentWordId, currentIndex, currentQueue.length, reviewWord, currentMode]);

  const switchMode = (mode: StudyMode) => {
    setCurrentMode(mode);
    setShowCompletion(false);
    setCurrentIndex(0);
    setCardKey((k) => k + 1);
  };

  const getFeedbackColor = () => {
    switch (feedback.result) {
      case 'forgot': return 'bg-red-500/90';
      case 'fuzzy': return 'bg-yellow-500/90';
      case 'remembered': return 'bg-green-500/90';
    }
  };

  const getFeedbackIcon = () => {
    switch (feedback.result) {
      case 'forgot': return '😵';
      case 'fuzzy': return '🤔';
      case 'remembered': return '🎉';
    }
  };

  const getFeedbackText = () => {
    switch (feedback.result) {
      case 'forgot': return '忘记了 - 明天再复习';
      case 'fuzzy': return '有点模糊 - 尽快再练';
      case 'remembered': return '完全记住 - 间隔延长';
    }
  };

  if (showCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl max-w-md w-full text-center animate-bounce-in">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            {currentMode === 'intensive' ? '强化训练完成！' : '今日任务完成！'}
          </h2>
          <p className="text-gray-500 mb-8">
            {currentMode === 'intensive'
              ? `完成了 ${completedIntensiveToday.length} 个重点单词强化`
              : `完成了 ${completedNormal} 个单词，继续加油！`}
          </p>

          <div className="space-y-3">
            {currentMode === 'normal' && intensiveQueue.length > 0 && (
              <button
                onClick={() => switchMode('intensive')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <Zap className="w-5 h-5" />
                开始重点强化训练 ({intensiveQueue.length}个)
              </button>
            )}
            <button
              onClick={() => { setShowCompletion(false); setCurrentIndex(0); setCardKey(k => k + 1); }}
              className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
            >
              再练一遍
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord || !currentProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">太棒了！</h2>
          <p className="text-gray-500 mb-6">今日的所有任务都已完成</p>
          {intensiveQueue.length > 0 && (
            <button
              onClick={() => switchMode('intensive')}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              进行重点强化训练
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => switchMode('normal')}
              className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                currentMode === 'normal'
                  ? 'bg-white text-primary-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              今日任务
            </button>
            <button
              onClick={() => switchMode('intensive')}
              className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                currentMode === 'intensive'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Zap className="w-4 h-4" />
              重点强化
              {intensiveQueue.length > 0 && (
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                  {intensiveQueue.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-white/90 font-medium">
            {currentIndex + 1} / {currentQueue.length}
          </div>
        </div>

        {currentMode === 'normal' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                今日学习计划
              </h3>
              <span className="text-white/70 text-sm">
                已完成 {completedNormal}/{totalTasks}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <PlanItem
                icon={<Sparkles className="w-4 h-4" />}
                label="新学单词"
                currentCount={todayPlan.newWords.filter(id => completedToday.includes(id)).length}
                totalCount={todayPlan.newWords.length}
                limit={todayPlan.newWordsLimit || userSettings.dailyNewWords}
                color="from-blue-500 to-cyan-500"
                onMinus={() => adjustTodayPlanLimit('new', -5)}
                onPlus={() => adjustTodayPlanLimit('new', 5)}
              />
              <PlanItem
                icon={<Brain className="w-4 h-4" />}
                label="复习单词"
                currentCount={todayPlan.reviewWords.filter(id => completedToday.includes(id)).length}
                totalCount={todayPlan.reviewWords.length}
                limit={todayPlan.reviewWordsLimit || userSettings.dailyReviewWords}
                color="from-green-500 to-emerald-500"
                onMinus={() => adjustTodayPlanLimit('review', -5)}
                onPlus={() => adjustTodayPlanLimit('review', 5)}
              />
              <PlanItem
                icon={<Zap className="w-4 h-4" />}
                label="重点强化"
                currentCount={completedIntensiveToday.length}
                totalCount={todayPlan.intensiveWords.length}
                limit={todayPlan.intensiveWordsLimit || userSettings.dailyIntensiveWords}
                color="from-orange-500 to-red-500"
                onMinus={() => adjustTodayPlanLimit('intensive', -5)}
                onPlus={() => adjustTodayPlanLimit('intensive', 5)}
              />
            </div>

            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${totalTasks > 0 ? (completedNormal / totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {currentMode === 'intensive' && (
          <div className="bg-gradient-to-r from-orange-500/30 to-red-500/30 backdrop-blur-md rounded-2xl p-5 mb-6 border border-orange-300/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5" />
                  重点强化训练
                </h3>
                <p className="text-white/70 text-sm">只练习星标单词和最近答错的单词</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {completedIntensiveToday}/{todayPlan.intensiveWords.length + intensiveQueue.length}
                </div>
                <div className="text-white/70 text-sm">已完成</div>
              </div>
            </div>
            <button
              onClick={() => switchMode('normal')}
              className="mt-4 flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回今日任务
            </button>
          </div>
        )}

        <div className="relative">
          {feedback.show && (
            <div className={`absolute inset-0 z-20 flex items-center justify-center ${getFeedbackColor()} rounded-3xl animate-fade-in`}>
              <div className="text-center text-white">
                <div className="text-6xl mb-3">{getFeedbackIcon()}</div>
                <div className="text-xl font-bold">{getFeedbackText()}</div>
              </div>
            </div>
          )}

          <div key={cardKey} className="animate-fade-in">
            <WordCard word={currentWord} progress={currentProgress} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <button
            onClick={() => handleReview('forgot')}
            className="py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <div>😵</div>
            <div className="mt-1">忘记了</div>
          </button>
          <button
            onClick={() => handleReview('fuzzy')}
            className="py-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <div>🤔</div>
            <div className="mt-1">有点模糊</div>
          </button>
          <button
            onClick={() => handleReview('remembered')}
            className="py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <div>🎉</div>
            <div className="mt-1">完全记住</div>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PlanItemProps {
  icon: React.ReactNode;
  label: string;
  currentCount: number;
  totalCount: number;
  limit: number;
  color: string;
  onMinus: () => void;
  onPlus: () => void;
}

const PlanItem: React.FC<PlanItemProps> = ({
  icon,
  label,
  currentCount,
  totalCount,
  limit,
  color,
  onMinus,
  onPlus,
}) => {
  return (
    <div className={`bg-gradient-to-br ${color} bg-opacity-20 rounded-xl p-3 border border-white/20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinus}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onPlus}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-white">{currentCount}</span>
        <span className="text-white/70 text-sm">/ {totalCount}</span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/80 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, totalCount > 0 ? (currentCount / Math.max(totalCount, limit)) * 100 : 0)}%` }}
        />
      </div>
      <div className="text-white/60 text-xs mt-1">目标: {limit}个</div>
    </div>
  );
};
