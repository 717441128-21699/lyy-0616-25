import React, { useMemo, useState } from 'react';
import { X, Clock, Target, Zap, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { ReviewResult, StudyMode } from '../types';

interface StudyHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterMode = 'all' | StudyMode | 'retry';

const resultIcons: Record<ReviewResult, string> = {
  forgot: '😵',
  fuzzy: '🤔',
  remembered: '🎉',
};

const resultLabels: Record<ReviewResult, string> = {
  forgot: '忘记了',
  fuzzy: '有点模糊',
  remembered: '完全记住',
};

const resultColors: Record<ReviewResult, string> = {
  forgot: 'bg-red-100 text-red-700',
  fuzzy: 'bg-yellow-100 text-yellow-700',
  remembered: 'bg-green-100 text-green-700',
};

const modeLabels: Record<FilterMode, string> = {
  all: '全部',
  normal: '今日任务',
  intensive: '重点强化',
  retry: '再练一遍',
};

const modeIcons: Record<Exclude<FilterMode, 'all'>, React.FC<{ className?: string }>> = {
  normal: Target,
  intensive: Zap,
  retry: Repeat,
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const StudyHistoryDrawer: React.FC<StudyHistoryDrawerProps> = ({ isOpen, onClose }) => {
  const { dailyReviewLogs, getWordById } = useStore();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const logs = [...dailyReviewLogs].reverse();
    if (filter === 'all') return logs;
    return logs.filter((log) => log.mode === filter);
  }, [dailyReviewLogs, filter]);

  const stats = useMemo(() => {
    const modes: Record<string, { count: number; correct: number }> = {};
    let totalCorrect = 0;

    dailyReviewLogs.forEach((log) => {
      const key = log.mode;
      if (!modes[key]) modes[key] = { count: 0, correct: 0 };
      modes[key].count++;
      if (log.result !== 'forgot') {
        modes[key].correct++;
      }
    });

    dailyReviewLogs.forEach((log) => {
      if (log.result !== 'forgot') totalCorrect++;
    });

    return {
      total: dailyReviewLogs.length,
      correct: totalCorrect,
      modes,
    };
  }, [dailyReviewLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">今日学习记录</h2>
            <p className="text-sm text-gray-500">
              共 {stats.total} 次，正确率{' '}
              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(['all', 'normal', 'intensive', 'retry'] as FilterMode[]).map((mode) => {
              const Icon = mode === 'all' ? null : modeIcons[mode];
              const count = mode === 'all' ? stats.total : (stats.modes[mode]?.count || 0);

              return (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filter === mode
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{modeLabels[mode]}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      filter === mode ? 'bg-white/20' : 'bg-gray-200'}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">还没有学习记录</p>
              <p className="text-sm text-gray-400 mt-1">开始学习后记录会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
              const word = getWordById(log.wordId);
              const isExpanded = expanded === log.id;

              return (
                <div
                  key={log.id}
                  className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="text-2xl">{resultIcons[log.result]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 truncate">
                          {word?.word || '未知单词'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${resultColors[log.result]}`}
                        >
                          {resultLabels[log.result]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="text-gray-400">
                          {log.mode === 'normal' && '🎯 今日任务'}
                          {log.mode === 'intensive' && '⚡ 重点强化'}
                          {log.mode === 'retry' && '🔁 再练一遍'}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{formatTime(log.timestamp)}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && word && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-200 bg-white">
                      <div className="pt-2 space-y-1.5 text-sm">
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-16 shrink-0">音标</span>
                          <span className="text-gray-700">{word.phonetic}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-16 shrink-0">释义</span>
                          <span className="text-gray-700">{word.definition}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-16 shrink-0">耗时</span>
                          <span className="text-gray-700">{log.responseTime} 秒</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
