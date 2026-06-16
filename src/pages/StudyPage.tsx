import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, HelpCircle, XCircle, Trophy, Target, BookOpen } from 'lucide-react';
import { WordCard } from '../components/WordCard';
import { useStore } from '../store/useStore';
import type { ReviewResult } from '../types';

export const StudyPage: React.FC = () => {
  const { todayQueue, getWordById, getWordProgress, reviewWord, userProgress, completedToday, generateTodayQueue } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const startTime = useRef<number>(Date.now());
  
  const currentWordId = todayQueue[currentIndex];
  const currentWord = currentWordId ? getWordById(currentWordId) : null;
  const currentProgress = currentWordId ? getWordProgress(currentWordId) : null;
  
  useEffect(() => {
    if (todayQueue.length === 0) {
      generateTodayQueue();
    }
  }, [todayQueue.length, generateTodayQueue]);
  
  useEffect(() => {
    setIsFlipped(false);
    setShowResult(false);
    startTime.current = Date.now();
  }, [currentIndex]);
  
  const handleFlip = () => {
    setIsFlipped(true);
  };
  
  const handleReview = (result: ReviewResult) => {
    if (!currentWordId) return;
    
    const responseTime = Math.round((Date.now() - startTime.current) / 1000);
    reviewWord(currentWordId, result, responseTime);
    
    setShowResult(true);
    
    setTimeout(() => {
      setShowResult(false);
      if (currentIndex < todayQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 1000);
  };
  
  const resultMessages = {
    remembered: { icon: CheckCircle, color: 'text-green-500', message: '太棒了！' },
    fuzzy: { icon: HelpCircle, color: 'text-yellow-500', message: '继续加油！' },
    forgot: { icon: XCircle, color: 'text-red-500', message: '没关系，再来一次！' },
  };
  
  if (todayQueue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">今日任务完成！</h2>
          <p className="text-gray-600 mb-6">
            你已经完成了今天所有的单词学习任务。
            <br />
            已学习 {completedToday.length} 个单词
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{userProgress.streakDays}</p>
              <p className="text-sm text-gray-500">连续天数</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{userProgress.totalWordsLearned}</p>
              <p className="text-sm text-gray-500">已学单词</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{Math.round(userProgress.masteryRate * 100)}%</p>
              <p className="text-sm text-gray-500">掌握率</p>
            </div>
          </div>
          <button
            onClick={generateTodayQueue}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            继续学习更多单词
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentWord || !currentProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-white" />
              <h1 className="text-2xl font-bold text-white">今日学习</h1>
            </div>
            <div className="text-white/80">
              {currentIndex + 1} / {todayQueue.length}
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / todayQueue.length) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-4 text-white/70 text-sm">
            <span>已完成: {completedToday.length} 个</span>
            <span>剩余: {todayQueue.length - currentIndex - 1} 个</span>
          </div>
        </div>
        
        {showResult ? (
          <div className="animate-bounce-in flex flex-col items-center justify-center py-20">
            {(() => {
              const result = Object.entries(resultMessages).find(
                ([key]) => showResult && resultMessages[key as ReviewResult]
              )?.[1];
              if (!result) return null;
              const Icon = result.icon;
              return (
                <>
                  <Icon className={`w-24 h-24 ${result.color}`} />
                  <p className={`text-3xl font-bold mt-4 ${result.color}`}>{result.message}</p>
                </>
              );
            })()}
          </div>
        ) : (
          <>
            <WordCard
              word={currentWord}
              progress={currentProgress}
              showBack={isFlipped}
              onFlip={handleFlip}
              showControls={true}
            />
            
            {isFlipped ? (
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleReview('forgot')}
                  className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  <XCircle className="w-5 h-5" />
                  忘记了
                </button>
                <button
                  onClick={() => handleReview('fuzzy')}
                  className="flex items-center gap-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  <HelpCircle className="w-5 h-5" />
                  有点模糊
                </button>
                <button
                  onClick={() => handleReview('remembered')}
                  className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  完全记住
                </button>
              </div>
            ) : (
              <div className="mt-8 text-center">
                <button
                  onClick={handleFlip}
                  className="flex items-center gap-2 mx-auto px-8 py-4 bg-white hover:bg-gray-50 text-primary-600 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  点击查看释义
                </button>
                <p className="text-white/60 mt-4 text-sm">
                  提示：先尝试回忆单词的意思，再点击查看
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
