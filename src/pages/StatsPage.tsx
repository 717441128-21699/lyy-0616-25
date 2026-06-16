import React, { useMemo } from 'react';
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
import { BarChart2, Flame, BookOpen, Brain, TrendingUp, Calendar, Zap, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import { predictMemoryCurve, formatDate, addDays } from '../utils/spacedRepetition';

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
  const { userProgress, wordProgress, decks, getCurrentDeck } = useStore();
  const currentDeck = getCurrentDeck();

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

        {currentDeck && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              当前词库：{currentDeck.name} - 学习详情
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">单词</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">标记</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">熟练度</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">复习次数</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">下次复习</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">难度系数</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeck.words.slice(0, 10).map(word => {
                    const progress = wordProgress[word.id];
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

                    return (
                      <tr key={word.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">{word.word}</span>
                          <span className="text-gray-500 text-sm ml-2">{word.phonetic}</span>
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${proficiencyColors[progress?.proficiency || 'new']}`}>
                            {proficiencyLabels[progress?.proficiency || 'new']}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{progress?.repetitions || 0}</td>
                        <td className="py-3 px-4 text-gray-600">{progress?.nextReviewDate || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{progress?.easeFactor.toFixed(2) || '2.50'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {currentDeck.words.length > 10 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                显示前10个单词，共 {currentDeck.words.length} 个
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
