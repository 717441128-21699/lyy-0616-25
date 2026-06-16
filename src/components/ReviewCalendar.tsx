import React, { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  RotateCcw, Sparkles,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDate, predictFutureSchedule } from '../utils/spacedRepetition';

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

const monthLabels = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export const ReviewCalendar: React.FC = () => {
  const { wordProgress, getCurrentDeck, getWordById } = useStore();
  const currentDeck = getCurrentDeck();

  const [baseDate, setBaseDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const schedule = useMemo(() => {
    if (!currentDeck) return {};
    return predictFutureSchedule(wordProgress, currentDeck.words, 30);
  }, [wordProgress, currentDeck]);

  const calendarDays = useMemo(() => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    const remaining = 42 - days.length;
    for (let i = 0; i < remaining; i++) {
      days.push(null);
    }

    return days;
  }, [baseDate]);

  const today = formatDate(new Date());

  const prevMonth = () => {
    setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1));
    setExpandedDate(null);
  };

  const nextMonth = () => {
    setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1));
    setExpandedDate(null);
  };

  const goToday = () => {
    setBaseDate(new Date());
    setExpandedDate(null);
  };

  const getMaxCount = () => {
    const counts = Object.values(schedule).map(s => s.reviewCount + s.newCount);
    return Math.max(1, ...counts);
  };

  const expandedWords = useMemo(() => {
    if (!expandedDate || !schedule[expandedDate]) return [];
    const wordIds = schedule[expandedDate].wordIds;
    return wordIds
      .map(id => {
        const word = getWordById(id);
        const progress = wordProgress[id];
        return word ? { ...word, progress } : null;
      })
      .filter(Boolean) as Array<{
        id: string;
        word: string;
        phonetic: string;
        definition: string;
        example: string;
        exampleTranslation: string;
        progress?: typeof wordProgress[string];
      }>;
  }, [expandedDate, schedule, getWordById, wordProgress]);

  if (!currentDeck) return null;

  const maxCount = getMaxCount();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-500" />
          复习日历
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {baseDate.getFullYear()}年{monthLabels[baseDate.getMonth()]}
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToday}
            className="ml-2 px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
          >
            今天
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekdayLabels.map(d => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={idx} className="h-16" />;
          }

          const dateStr = formatDate(date);
          const daySchedule = schedule[dateStr];
          const reviewCount = daySchedule?.reviewCount || 0;
          const newCount = daySchedule?.newCount || 0;
          const totalCount = reviewCount + newCount;
          const isToday = dateStr === today;
          const isExpanded = expandedDate === dateStr;
          const hasItems = totalCount > 0;
          const intensity = hasItems ? Math.max(0.15, totalCount / maxCount) : 0;

          return (
            <button
              key={idx}
              onClick={() => setExpandedDate(isExpanded ? null : dateStr)}
              className={`h-16 rounded-lg p-1 text-left transition-all relative ${
                isToday
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : isExpanded
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              } ${hasItems ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                {date.getDate()}
              </div>
              {hasItems && (
                <div className="mt-0.5">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mb-0.5"
                    style={{ width: `${Math.min(100, intensity * 100)}%`, opacity: 0.7 + intensity * 0.3 }}
                  />
                  <div className="text-xs text-gray-500 leading-tight">
                    {reviewCount > 0 && <span className="text-blue-600">{reviewCount}复</span>}
                    {newCount > 0 && <span className="text-green-600 ml-0.5">{newCount}新</span>}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {expandedDate && schedule[expandedDate] && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {expandedDate}
            {expandedDate === today && <span className="ml-2 text-primary-500">（今天）</span>}
            <span className="font-normal text-gray-500 ml-2">
              复习 {schedule[expandedDate].reviewCount} 个 · 新学 {schedule[expandedDate].newCount} 个
            </span>
          </h4>
          {expandedWords.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {expandedWords.map(w => {
                const isReview = w.progress && w.progress.repetitions > 0;
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                  >
                    {isReview ? (
                      <RotateCcw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    )}
                    <span className="font-medium text-gray-800">{w.word}</span>
                    <span className="text-gray-400 text-xs">{w.phonetic}</span>
                    <span className="text-gray-500 text-xs flex-1 truncate">{w.definition}</span>
                    {isReview && w.progress?.isStarred && (
                      <span className="text-yellow-500 text-xs">⭐</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">该日暂无学习计划</p>
          )}
        </div>
      )}
    </div>
  );
};
