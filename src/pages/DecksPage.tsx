import React, { useState } from 'react';
import { Book, Plus, Trash2, Check, GraduationCap, Globe, Award, FileText, Zap, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DeckImportModal } from '../components/DeckImportModal';

const categoryIcons = {
  cet4: GraduationCap,
  cet6: GraduationCap,
  ielts: Globe,
  toefl: Award,
  custom: FileText,
};

const categoryColors = {
  cet4: 'from-blue-500 to-cyan-500',
  cet6: 'from-purple-500 to-blue-600',
  ielts: 'from-red-500 to-pink-500',
  toefl: 'from-green-500 to-emerald-600',
  custom: 'from-orange-500 to-yellow-500',
};

export const DecksPage: React.FC = () => {
  const { decks, currentDeckId, setCurrentDeck, addCustomDeck, removeDeck, wordProgress } = useStore();
  const [showImport, setShowImport] = useState(false);

  const getDeckProgress = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return { learned: 0, total: 0, mastered: 0, starred: 0, recentWrong: 0 };

    let learned = 0;
    let mastered = 0;
    let starred = 0;
    let recentWrong = 0;

    deck.words.forEach(word => {
      const progress = wordProgress[word.id];
      if (progress) {
        if (progress.repetitions > 0) learned++;
        if (progress.proficiency === 'mastered') mastered++;
        if (progress.isStarred) starred++;
        if (progress.recentWrong) recentWrong++;
      }
    });

    return { learned, total: deck.words.length, mastered, starred, recentWrong };
  };

  const handleRemoveDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个词库吗？')) {
      removeDeck(deckId);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">词库管理</h1>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            导入词库
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => {
            const progress = getDeckProgress(deck.id);
            const Icon = categoryIcons[deck.category];
            const isSelected = currentDeckId === deck.id;
            const progressPercent = progress.total > 0 ? (progress.learned / progress.total) * 100 : 0;

            return (
              <div
                key={deck.id}
                onClick={() => setCurrentDeck(deck.id)}
                className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all hover:scale-105 shadow-xl ${
                  isSelected ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-green-500 rounded-full p-1">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}

                {deck.category === 'custom' && (
                  <button
                    onClick={(e) => handleRemoveDeck(deck.id, e)}
                    className="absolute top-4 right-14 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[deck.category]} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{deck.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{deck.description}</p>

                {(progress.starred > 0 || progress.recentWrong > 0) && (
                  <div className="flex gap-2 mb-4">
                    {progress.starred > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        {progress.starred} 星标
                      </span>
                    )}
                    {progress.recentWrong > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        <Zap className="w-3 h-3" />
                        {progress.recentWrong} 错词
                      </span>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">学习进度</span>
                    <span className="text-primary-600 font-semibold">
                      {progress.learned} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${categoryColors[deck.category]} transition-all`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{progress.mastered}</p>
                    <p className="text-gray-500 text-xs">已掌握</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{progress.learned - progress.mastered}</p>
                    <p className="text-gray-500 text-xs">学习中</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-400">{progress.total - progress.learned}</p>
                    <p className="text-gray-500 text-xs">未学习</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DeckImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={(name, words) => {
          addCustomDeck(name, words);
        }}
      />
    </div>
  );
};
