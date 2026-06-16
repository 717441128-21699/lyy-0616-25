import React, { useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  BarChart2, Flame, BookOpen, Brain, TrendingUp, Calendar, Zap, Star,
  ChevronDown, ChevronUp, Clock, Plus, Search, ChevronLeft,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { predictMemoryCurve, formatDate, addDays } from '../utils/spacedRepetition';
import { ReviewCalendar } from '../components/ReviewCalendar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const StatsPage: React.FC = () => {
  const {
    userProgress,
    wordProgress,
    decks,
    getCurrentDeck,
    toggleWordStarred,
    addWordToIntensive,
  } = useStore();
  const currentDeck = getCurrentDeck();
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [proficiencyFilter, setProficiencyFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [reviewTimeFilter, setReviewTimeFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 30;

  const starAndRecentWrongStats = useMemo(() => {
    const allProgress = Object.values(wordProgress);
    return {
      starred: allProgress.filter(p => p.isStarred).length,
      recentWrong: allProgress.filter(p => p.recentWrong).length,
      both: allProgress.filter(p => p.isStarred && p.recentWrong).length,
    };
  }, [wordProgress]);

  const proficiencyStats = useMemo(() => {
    const stats = {
      new: 0,
      learning: 0,
      familiar: 0,
      mastered: 0,
    };

    Object.values(wordProgress).forEach(progress => {
      stats[progress.proficiency]++;
    });

    const allWords = decks.reduce((acc, deck) => acc + deck.words.length, 0);
    stats.new = allWords - Object.values(wordProgress).filter(p => p.repetitions > 0).length;

    return stats;
  }, [wordProgress, decks]);

  const last30DaysStats = useMemo(() => {
    const today = new Date();
    const days: string[] = [];
    const newWords: number[] = [];
    const reviewedWords: number[] = [];
    const intensiveWords: number[] = [];
    const correctRates: number[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = formatDate(addDays(today, -i));
      const dayLabel = `${i === 0 ? '今日' : `${i}天前`}`;
      days.push(dayLabel);

      const dayStats = userProgress.dailyStats.find(s => s.date === date);
      newWords.push(dayStats?.newWordsLearned || 0);
      reviewedWords.push(dayStats?.wordsReviewed || 0);
      intensiveWords.push(dayStats?.intensiveReviewed || 0);
      correctRates.push(dayStats ? Math.round(dayStats.correctRate * 100) : 0);
    }

    return { days, newWords, reviewedWords, intensiveWords, correctRates };
  }, [userProgress.dailyStats]);

  const memoryCurveData = useMemo(() => {
    const sampleWords = Object.values(wordProgress)
      .filter(p => p.repetitions > 0)
      .slice(0, 5);

    if (sampleWords.length === 0) {
      return {
        labels: Array.from({ length: 30 }, (_, i) => `第${i + 1}天`),
        datasets: [],
      };
    }

    const colors = [
      'rgba(59, 130, 246, 0.5)',
      'rgba(16, 185, 129, 0.5)',
      'rgba(245, 158, 11, 0.5)',
      'rgba(139, 92, 246, 0.5)',
      'rgba(239, 68, 68, 0.5)',
    ];

    const borderColors = [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(245, 158, 11)',
      'rgb(139, 92, 246)',
      'rgb(239, 68, 68)',
    ];

    return {
      labels: Array.from({ length: 30 }, (_, i) => `第${i + 1}天`),
      datasets: sampleWords.map((progress, index) => {
        const word = decks.flatMap(d => d.words).find(w => w.id === progress.wordId);
        return {
          label: word?.word || `单词${index + 1}`,
          data: predictMemoryCurve(progress, 30),
          borderColor: borderColors[index % borderColors.length],
          backgroundColor: colors[index % colors.length],
          fill: false,
          tension: 0.4,
        };
      }),
    };
  }, [wordProgress, decks]);

  const dailyChartData = {
    labels: last30DaysStats.days,
    datasets: [
      {
        label: '新学单词',
        data: last30DaysStats.newWords,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8,
      },
      {
        label: '复习单词',
        data: last30DaysStats.reviewedWords,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      },
      {
        label: '重点强化',
        data: last30DaysStats.intensiveWords,
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const proficiencyChartData = {
    labels: ['新单词', '学习中', '熟悉', '已掌握'],
    datasets: [
      {
        data: [
          proficiencyStats.new,
          proficiencyStats.learning,
          proficiencyStats.familiar,
          proficiencyStats.mastered,
        ],
        backgroundColor: [
          'rgba(156, 163, 175, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const correctRateChartData = {
    labels: last30DaysStats.days,
    datasets: [
      {
        label: '正确率 %',
        data: last30DaysStats.correctRates,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BarChart2 className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">学习统计</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-gray-500 text-sm">连续打卡</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{userProgress.streakDays} 天</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-gray-500 text-sm">已学单词</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{userProgress.totalWordsLearned}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-gray-500 text-sm">掌握率</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{Math.round(userProgress.masteryRate * 100)}%</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-gray-500 text-sm">总复习</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{userProgress.totalReviews}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-gray-500 text-sm">强化次数</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{userProgress.totalIntensiveReviews}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-gray-500 text-sm">星标/错词</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              <span className="text-yellow-600">{starAndRecentWrongStats.starred}</span>
              <span className="text-gray-400 text-base mx-1">/</span>
              <span className="text-red-500">{starAndRecentWrongStats.recentWrong}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">近30天学习量</h3>
            <div className="h-64">
              <Bar data={dailyChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">熟练度分布</h3>
            <div className="h-64">
              <Doughnut data={proficiencyChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">近30天正确率趋势</h3>
            <div className="h-64">
              <Line data={correctRateChartData} options={lineOptions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold text-gray-800">记忆曲线预测（未来30天）</h3>
            </div>
            {memoryCurveData.datasets.length > 0 ? (
              <div className="h-64">
                <Line data={memoryCurveData} options={lineOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                开始学习后将显示记忆曲线预测
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              * 记忆曲线基于间隔重复算法预测，显示单词记忆保留率随时间的变化
            </p>
          </div>
        </div>

        <div className="mb-6">
          <ReviewCalendar />
        </div>

        {currentDeck && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              当前词库：{currentDeck.name} - 单词台账
            </h3>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  placeholder="搜索单词或释义..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <select
                value={proficiencyFilter}
                onChange={(e) => { setProficiencyFilter(e.target.value); setPage(0); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">全部熟练度</option>
                <option value="new">新单词</option>
                <option value="learning">学习中</option>
                <option value="familiar">熟悉</option>
                <option value="mastered">已掌握</option>
              </select>

              <select
                value={tagFilter}
                onChange={(e) => { setTagFilter(e.target.value); setPage(0); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">全部标记</option>
                <option value="starred">星标词</option>
                <option value="recentWrong">近期错词</option>
              </select>

              <select
                value={reviewTimeFilter}
                onChange={(e) => { setReviewTimeFilter(e.target.value); setPage(0); }}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">全部复习时间</option>
                <option value="today">今天需复习</option>
                <option value="overdue">已逾期</option>
                <option value="week">7天内复习</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-8 py-3 px-3"></th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">单词</th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">标记</th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">熟练度</th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">复习次数</th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">下次复习</th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">难度</th>
                    <th className="text-right py-3 px-3 text-gray-600 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeck.words
                    .filter(word => {
                      const progress = wordProgress[word.id];
                      const prof = progress?.proficiency || 'new';

                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        if (!word.word.toLowerCase().includes(q) && !word.definition.toLowerCase().includes(q)) {
                          return false;
                        }
                      }

                      if (proficiencyFilter !== 'all' && prof !== proficiencyFilter) return false;

                      if (tagFilter === 'starred' && !progress?.isStarred) return false;
                      if (tagFilter === 'recentWrong' && !progress?.recentWrong) return false;

                      if (reviewTimeFilter !== 'all' && progress) {
                        const nextDate = progress.nextReviewDate;
                        const todayStr = formatDate(new Date());
                        if (reviewTimeFilter === 'today' && nextDate !== todayStr) return false;
                        if (reviewTimeFilter === 'overdue' && nextDate > todayStr) return false;
                        if (reviewTimeFilter === 'week') {
                          const weekLater = formatDate(addDays(new Date(), 7));
                          if (nextDate > weekLater || nextDate < todayStr) return false;
                        }
                      }
                      if (reviewTimeFilter !== 'all' && !progress) return false;

                      return true;
                    })
                    .slice(page * pageSize, (page + 1) * pageSize)
                    .map(word => {
                      const progress = wordProgress[word.id];
                      const isExpanded = expandedWordId === word.id;
                      const proficiencyColors = {
                        new: 'bg-gray-100 text-gray-600',
                        learning: 'bg-blue-100 text-blue-600',
                        familiar: 'bg-green-100 text-green-600',
                        mastered: 'bg-purple-100 text-purple-600',
                      };
                      const proficiencyLabels = {
                        new: '新单词',
                        learning: '学习中',
                        familiar: '熟悉',
                        mastered: '已掌握',
                      };
                      const prof = progress?.proficiency || 'new';

                      return (
                        <React.Fragment key={word.id}>
                          <tr className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                              onClick={() => setExpandedWordId(isExpanded ? null : word.id)}>
                            <td className="py-3 px-3 text-gray-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-medium text-gray-800">{word.word}</span>
                              <span className="text-gray-500 text-sm ml-2">{word.phonetic}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-1">
                                {progress?.isStarred && (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                                    ⭐ 星标
                                  </span>
                                )}
                                {progress?.recentWrong && (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                                    近期错词
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${proficiencyColors[prof]}`}>
                                {proficiencyLabels[prof]}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-600">{progress?.repetitions || 0}</td>
                            <td className="py-3 px-3 text-gray-600">{progress?.nextReviewDate || '-'}</td>
                            <td className="py-3 px-3 text-gray-600">{progress?.easeFactor.toFixed(2) || '2.50'}</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {!progress?.isStarred ? (
                                  <button
                                    onClick={() => {
                                      addWordToIntensive(word.id);
                                    }}
                                    className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-0.5"
                                    title="加入重点强化"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <Zap className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleWordStarred(word.id)}
                                    className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="取消星标"
                                  >
                                    <Star className="w-4 h-4 fill-yellow-400" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && progress && (
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <td colSpan={8} className="py-4 px-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <BookOpen className="w-4 h-4" />
                                      单词信息
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex gap-2">
                                        <span className="text-gray-500 w-16 shrink-0">释义</span>
                                        <span className="text-gray-700">{word.definition}</span>
                                      </div>
                                      {word.example && (
                                        <div className="flex gap-2">
                                          <span className="text-gray-500 w-16 shrink-0">例句</span>
                                          <div className="text-gray-700">
                                            <p>{word.example}</p>
                                            {word.exampleTranslation && (
                                              <p className="text-gray-500 text-xs mt-1">{word.exampleTranslation}</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {progress.notes && (
                                        <div className="flex gap-2">
                                          <span className="text-gray-500 w-16 shrink-0">笔记</span>
                                          <span className="text-gray-700">{progress.notes}</span>
                                        </div>
                                      )}
                                      <div className="flex gap-2">
                                        <span className="text-gray-500 w-16 shrink-0">下次复习</span>
                                        <span className="text-gray-700">{progress.nextReviewDate}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <span className="text-gray-500 w-16 shrink-0">来源</span>
                                        <span className="text-gray-700">
                                          {progress.reviewHistory.some(r => r.mode === 'intensive') ? '含重点强化' : '仅今日任务'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      最近复习记录
                                    </h4>
                                    {progress.reviewHistory && progress.reviewHistory.length > 0 ? (
                                      <div className="space-y-2 max-h-36 overflow-y-auto">
                                        {[...progress.reviewHistory].reverse().slice(0, 10).map((record, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-sm bg-white rounded-lg p-2 border border-gray-100">
                                            <span className="text-lg">
                                              {record.quality === 0 ? '😵' : record.quality === 3 ? '🤔' : '🎉'}
                                            </span>
                                            <div className="flex-1">
                                              <span className="text-gray-600">
                                                {record.quality === 0 ? '忘记了' : record.quality === 3 ? '有点模糊' : '完全记住'}
                                              </span>
                                              {record.mode === 'intensive' && (
                                                <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-xs">
                                                  强化
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-gray-400 text-xs">{record.date}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-400">暂无复习记录</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {(() => {
              const filteredTotal = currentDeck.words.filter(word => {
                const progress = wordProgress[word.id];
                const prof = progress?.proficiency || 'new';
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  if (!word.word.toLowerCase().includes(q) && !word.definition.toLowerCase().includes(q)) return false;
                }
                if (proficiencyFilter !== 'all' && prof !== proficiencyFilter) return false;
                if (tagFilter === 'starred' && !progress?.isStarred) return false;
                if (tagFilter === 'recentWrong' && !progress?.recentWrong) return false;
                if (reviewTimeFilter !== 'all' && progress) {
                  const nextDate = progress.nextReviewDate;
                  const todayStr = formatDate(new Date());
                  if (reviewTimeFilter === 'today' && nextDate !== todayStr) return false;
                  if (reviewTimeFilter === 'overdue' && nextDate > todayStr) return false;
                  if (reviewTimeFilter === 'week') {
                    const weekLater = formatDate(addDays(new Date(), 7));
                    if (nextDate > weekLater || nextDate < todayStr) return false;
                  }
                }
                if (reviewTimeFilter !== 'all' && !progress) return false;
                return true;
              }).length;

              const totalPages = Math.ceil(filteredTotal / pageSize);

              return (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    共 {filteredTotal} 个单词
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600">
                        {page + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
