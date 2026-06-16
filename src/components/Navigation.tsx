import React from 'react';
import { Book, BarChart2, Settings, GraduationCap, BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { todayPlan, completedToday, userProgress, getCurrentDeck } = useStore();

  const currentDeck = getCurrentDeck();
  const totalTasks = todayPlan.newWords.length + todayPlan.reviewWords.length;
  const remainingCount = Math.max(0, totalTasks - completedToday.length);

  const navItems = [
    { path: '/', icon: BookOpen, label: '学习', badge: remainingCount > 0 ? remainingCount : null },
    { path: '/decks', icon: Book, label: '词库', badge: null },
    { path: '/stats', icon: BarChart2, label: '统计', badge: null },
    { path: '/settings', icon: Settings, label: '设置', badge: null },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-b border-white/20 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">单词记忆</h1>
                {currentDeck && (
                  <p className="text-xs text-white/70">当前: {currentDeck.name}</p>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {userProgress.streakDays > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full">
                  <span className="text-orange-300">🔥</span>
                  <span className="text-white font-semibold">{userProgress.streakDays} 天连续</span>
                </div>
              )}

              <div className="bg-white/10 px-4 py-2 rounded-full">
                <span className="text-white">
                  今日: {completedToday.length} / {totalTasks}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20 z-40 md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all relative ${
                  active ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-20 bg-white/5 backdrop-blur-lg border-r border-white/10 z-30">
        <div className="flex flex-col items-center py-6 gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all group ${
                  active
                    ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-6 h-6" />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <span className="absolute left-14 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-16 pb-20 md:pt-16 md:pb-0 md:pl-20" />
    </>
  );
};
