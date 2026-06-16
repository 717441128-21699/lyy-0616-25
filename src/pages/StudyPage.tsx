import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sparkles, Target, Brain, Minus, Plus, Zap, Trophy, ArrowLeft, Repeat } from 'lucide-react';
import { WordCard } from '../components/WordCard';
import { useStore } from '../store/useStore';
import type { ReviewResult, StudyMode } from '../types';

interface FeedbackState {
  show: boolean;
  result: ReviewResult;
}

type PracticeMode = 'normal' | 'intensive' | 'retry';

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

  const [normalIndex, setNormalIndex] = useState(0);
  const [intensiveIndex, setIntensiveIndex] = useState(0);

  const [normalQueueSnapshot, setNormalQueueSnapshot] = useState<string[]>([]);
  const [intensiveQueueSnapshot, setIntensiveQueueSnapshot] = useState<string[]>([]);

  const [practiceMode, setPracticeMode] = useState<PracticeMode>('normal');
  const [retryQueue, setRetryQueue] = useState<string[]>([]);
  const [retryIndex, setRetryIndex] = useState(0);
  const [lastCompletedNormalQueue, setLastCompletedNormalQueue] = useState<string[]>([]);
  const [lastCompletedIntensiveQueue, setLastCompletedIntensiveQueue] = useState<string[]>([]);

  const [showCompletion, setShowCompletion] = useState<StudyMode | 'retry' | null>(null);
  const [cardKey, setCardKey] = useState(0);

  const initialized = useRef(false);

  useEffect(() => {
    regenerateTodayPlan();
  }, [regenerateTodayPlan]);

  const rawNormalQueue = useMemo(() => getCurrentQueue(), [getCurrentQueue]);
  const rawIntensiveQueue = useMemo(() => getIntensiveQueue(), [getIntensiveQueue]);

  useEffect(() => {
    if (!initialized.current) {
      setNormalQueueSnapshot(rawNormalQueue);
      setIntensiveQueueSnapshot(rawIntensiveQueue);
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (normalQueueSnapshot.length === 0 && rawNormalQueue.length > 0) {
      setNormalQueueSnapshot(rawNormalQueue);
    }
    if (intensiveQueueSnapshot.length === 0 && rawIntensiveQueue.length > 0) {
      setIntensiveQueueSnapshot(rawIntensiveQueue);
    }
  }, [rawNormalQueue, rawIntensiveQueue, normalQueueSnapshot.length, intensiveQueueSnapshot.length]);

  const getCurrentQueueState = () => {
    switch (practiceMode) {
      case 'retry':
        return { queue: retryQueue, index: retryIndex, completed: retryIndex };
      case 'intensive':
        return { queue: intensiveQueueSnapshot, index: intensiveIndex, completed: completedIntensiveToday.length };
      default:
        return { queue: normalQueueSnapshot, index: normalIndex, completed: completedToday.length };
    }
  };

  const { queue: currentQueue, index: currentIndex } = getCurrentQueueState();
  const effectiveMode: StudyMode = practiceMode === 'retry' ? 'normal' : currentMode;

  const currentWordId = currentQueue[currentIndex];
  const currentWord = currentWordId ? getWordById(currentWordId) : null;
  const currentProgress = currentWordId ? getWordProgress(currentWordId) : null;

  const totalNormalTasks = todayPlan.reviewWords.length + todayPlan.newWords.length;
  const totalIntensiveTasks = intensiveQueueSnapshot.length;

  const switchToMode = (mode: StudyMode) => {
    if (currentMode !== mode) {
      setCurrentMode(mode);
    }
    setPracticeMode(mode);
    setShowCompletion(null);
    setCardKey((k) => k + 1);
  };

  const handleReview = useCallback((result: ReviewResult) => {
    if (!currentWordId) return;

    const startTime = performance.now();
    const responseTime = Math.max(1, Math.round((performance.now() - startTime) / 100));

    if (practiceMode !== 'retry') {
      reviewWord(currentWordId, result, responseTime, effectiveMode);
    }

    setFeedback({ show: true, result });
    setCardKey((k) => k + 1);

    setTimeout(() => {
      setFeedback({ show: false, result: 'remembered' });

      const nextIndex = currentIndex + 1;
      const totalCount = currentQueue.length;

      if (nextIndex >= totalCount && totalCount > 0) {
        if (practiceMode === 'normal') {
          setLastCompletedNormalQueue([...currentQueue]);
        } else if (practiceMode === 'intensive') {
          setLastCompletedIntensiveQueue([...currentQueue]);
        }
        setShowCompletion(practiceMode === 'retry' ? 'retry' : currentMode);
      } else {
        switch (practiceMode) {
          case 'retry':
            setRetryIndex(nextIndex);
            break;
          case 'intensive':
            setIntensiveIndex(nextIndex);
            break;
          default:
            setNormalIndex(nextIndex);
        }
      }
    }, 600);
  }, [
    currentWordId,
    currentIndex,
    currentQueue,
    practiceMode,
    currentMode,
    effectiveMode,
    reviewWord,
  ]);

  const handleLimitAdjust = (type: 'new' | 'review' | 'intensive', delta: number) => {
    adjustTodayPlanLimit(type, delta);
    setTimeout(() => {
      if (type === 'intensive') {
        setIntensiveQueueSnapshot(getIntensiveQueue());
      } else {
        setNormalQueueSnapshot(getCurrentQueue());
      }
    }, 50);
  };

  const startRetryPractice = () => {
    let queue: string[] = [];
    if (showCompletion === 'intensive') {
      queue = [...lastCompletedIntensiveQueue];
    } else {
      queue = [...lastCompletedNormalQueue];
    }

    if (queue.length === 0) {
      if (showCompletion === 'intensive') {
        queue = [...intensiveQueueSnapshot];
      } else {
        queue = [...normalQueueSnapshot];
      }
    }

    setRetryQueue(queue);
    setRetryIndex(0);
    setPracticeMode('retry');
    setShowCompletion(null);
    setCardKey((k) => k + 1);
  };

  const exitRetryPractice = () => {
    setPracticeMode(currentMode);
    setShowCompletion(currentMode);
    setRetryQueue([]);
    setRetryIndex(0);
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

  const getCompletionTitle = () => {
    if (showCompletion === 'retry') return '再练一遍完成！';
    if (showCompletion === 'intensive') return '强化训练完成！';
    return '今日任务完成！';
  };

  const getCompletionSubtitle = () => {
    if (showCompletion === 'retry') return `重练了 ${retryQueue.length} 个单词`;
    if (showCompletion === 'intensive') return `完成了 ${completedIntensiveToday.length} 个重点单词强化`;
    return `完成了 ${completedToday.length} 个单词，继续加油！`;
  };

  if (showCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl max-w-md w-full text-center animate-bounce-in">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">{getCompletionTitle()}</h2>
          <p className="text-gray-500 mb-8">{getCompletionSubtitle()}</p>

          <div className="space-y-3">
            {showCompletion !== 'retry' && (
              <button
                onClick={startRetryPractice}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <Repeat className="w-5 h-5" />
                再练一遍（不影响统计）
              </button>
            )}

            {showCompletion === 'retry' && (
              <button
                onClick={exitRetryPractice}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
                返回完成页
              </button>
            )}

            {showCompletion === 'normal' && rawIntensiveQueue.length > 0 && (
              <button
                onClick={() => switchToMode('intensive')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <Zap className="w-5 h-5" />
                开始重点强化训练
              </button>
            )}

            {showCompletion !== 'retry' && (
              <button
                onClick={() => {
                  if (showCompletion === 'intensive') {
                    setIntensiveIndex(0);
                    setIntensiveQueueSnapshot([...rawIntensiveQueue]);
                  } else {
                    setNormalIndex(0);
                    setNormalQueueSnapshot([...rawNormalQueue]);
                  }
                  setShowCompletion(null);
                  setCardKey(k => k + 1);
                }}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
              >
                重新从第1张开始
              </button>
            )}

            {showCompletion !== 'retry' && (
              <button
                onClick={() => switchToMode(showCompletion === 'intensive' ? 'normal' : 'intensive')}
                className="w-full py-4 text-gray-600 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              >
                {showCompletion === 'intensive' ? '返回今日任务' : '切换到强化训练'}
              </button>
            )}
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
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {practiceMode === 'retry' ? '没有可重练的词' : (practiceMode === 'intensive' ? '暂无需强化的单词' : '今日的所有任务都已完成')}
          </h2>
          <p className="text-gray-500 mb-6">
            {practiceMode === 'intensive'
              ? '将单词标星或答错后会出现在这里'
              : '可以调整今日计划数量或切换模式继续学习'}
          </p>
          <div className="space-y-3">
            {practiceMode !== 'normal' && (
              <button
                onClick={() => switchToMode('normal')}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-2xl font-semibold"
              >
                返回今日任务
              </button>
            )}
            {practiceMode === 'normal' && rawIntensiveQueue.length > 0 && (
              <button
                onClick={() => switchToMode('intensive')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                进行重点强化训练
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayCurrentMode: StudyMode = practiceMode === 'retry' ? currentMode : practiceMode;

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => switchToMode('normal')}
              className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                displayCurrentMode === 'normal' && practiceMode !== 'retry'
                  ? 'bg-white text-primary-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Target className="w-4 h-4" />
              今日任务
            </button>
            <button
              onClick={() => switchToMode('intensive')}
              className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                displayCurrentMode === 'intensive'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Zap className="w-4 h-4" />
              重点强化
              {rawIntensiveQueue.length > 0 && (
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                  {rawIntensiveQueue.length}
                </span>
              )}
            </button>
            {practiceMode === 'retry' && (
              <span className="px-4 py-2 rounded-xl font-medium flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                <Repeat className="w-4 h-4" />
                再练一遍（不计入统计）
              </span>
            )}
          </div>

          <div className="text-white/90 font-medium bg-white/10 px-4 py-2 rounded-xl">
            {currentIndex + 1} / {currentQueue.length}
            {practiceMode === 'retry' && <span className="ml-2 text-blue-300 text-sm">重练中</span>}
          </div>
        </div>

        {practiceMode === 'normal' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                今日学习计划
              </h3>
              <span className="text-white/70 text-sm">
                已完成 {completedToday.length}/{totalNormalTasks}
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
                onMinus={() => handleLimitAdjust('new', -5)}
                onPlus={() => handleLimitAdjust('new', 5)}
              />
              <PlanItem
                icon={<Brain className="w-4 h-4" />}
                label="复习单词"
                currentCount={todayPlan.reviewWords.filter(id => completedToday.includes(id)).length}
                totalCount={todayPlan.reviewWords.length}
                limit={todayPlan.reviewWordsLimit || userSettings.dailyReviewWords}
                color="from-green-500 to-emerald-500"
                onMinus={() => handleLimitAdjust('review', -5)}
                onPlus={() => handleLimitAdjust('review', 5)}
              />
              <PlanItem
                icon={<Zap className="w-4 h-4" />}
                label="重点强化"
                currentCount={completedIntensiveToday.length}
                totalCount={totalIntensiveTasks}
                limit={todayPlan.intensiveWordsLimit || userSettings.dailyIntensiveWords}
                color="from-orange-500 to-red-500"
                onMinus={() => handleLimitAdjust('intensive', -5)}
                onPlus={() => handleLimitAdjust('intensive', 5)}
              />
            </div>

            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${totalNormalTasks > 0 ? Math.min(100, (completedToday.length / totalNormalTasks) * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        {practiceMode === 'intensive' && (
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
                  {completedIntensiveToday.length}/{totalIntensiveTasks + (intensiveQueueSnapshot.length - completedIntensiveToday.length > 0 ? 0 : 0)}
                </div>
                <div className="text-white/70 text-sm">已完成</div>
              </div>
            </div>
            <button
              onClick={() => switchToMode('normal')}
              className="mt-4 flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回今日任务
            </button>
          </div>
        )}

        {practiceMode === 'retry' && (
          <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur-md rounded-2xl p-5 mb-6 border border-blue-300/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
                  <Repeat className="w-5 h-5" />
                  再练一遍模式
                </h3>
                <p className="text-white/70 text-sm">本次练习不影响学习统计</p>
              </div>
              <button
                onClick={exitRetryPractice}
                className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                退出重练
              </button>
            </div>
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
  const progressPct = totalCount > 0 ? Math.min(100, (currentCount / Math.max(totalCount, limit)) * 100) : 0;
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-3 border border-white/20`}>
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
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="text-white/60 text-xs mt-1">目标: {limit}个</div>
    </div>
  );
};
