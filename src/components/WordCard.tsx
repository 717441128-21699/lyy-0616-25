import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Star, Edit3, Lightbulb, BookOpen } from 'lucide-react';
import type { Word, WordProgress } from '../types';
import { speakWord } from '../utils/audio';
import { calculateRetrievability } from '../utils/spacedRepetition';
import { useStore } from '../store/useStore';

interface WordCardProps {
  word: Word;
  progress: WordProgress;
  showBack?: boolean;
  onFlip?: () => void;
  showControls?: boolean;
}

const proficiencyColors = {
  new: 'bg-gray-400',
  learning: 'bg-blue-400',
  familiar: 'bg-green-400',
  mastered: 'bg-purple-500',
};

const proficiencyLabels = {
  new: '新单词',
  learning: '学习中',
  familiar: '熟悉',
  mastered: '已掌握',
};

export const WordCard: React.FC<WordCardProps> = ({
  word,
  progress,
  showBack = false,
  onFlip,
  showControls = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(showBack);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(progress.notes);
  const [mnemonic, setMnemonic] = useState(progress.mnemonic);
  const [editingField, setEditingField] = useState<'notes' | 'mnemonic' | null>(null);
  const autoPlayed = useRef(false);
  
  const { toggleWordStarred, updateWordNotes, updateWordMnemonic, userSettings } = useStore();
  const retrievability = calculateRetrievability(progress);
  
  useEffect(() => {
    setIsFlipped(showBack);
  }, [showBack]);
  
  useEffect(() => {
    if (userSettings.autoPlayAudio && !autoPlayed.current) {
      autoPlayed.current = true;
      setTimeout(() => speakWord(word.word), 300);
    }
  }, [word.word, userSettings.autoPlayAudio]);
  
  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    } else {
      setIsFlipped(!isFlipped);
    }
  };
  
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakWord(word.word);
  };
  
  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWordStarred(word.id);
  };
  
  const handleSaveNotes = () => {
    updateWordNotes(word.id, notes);
    setEditingField(null);
  };
  
  const handleSaveMnemonic = () => {
    updateWordMnemonic(word.id, mnemonic);
    setEditingField(null);
  };
  
  const getRetrievabilityColor = () => {
    if (retrievability > 80) return 'text-green-500';
    if (retrievability > 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card-flip w-full h-96 cursor-pointer" onClick={handleFlip}>
        <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="card-front bg-white flex flex-col items-center justify-center p-8">
            {progress.isStarred && (
              <div className="absolute top-4 right-4">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
            )}
            
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-white text-sm ${proficiencyColors[progress.proficiency]}`}>
                {proficiencyLabels[progress.proficiency]}
              </span>
              {progress.repetitions > 0 && (
                <span className={`ml-2 text-sm font-medium ${getRetrievabilityColor()}`}>
                  记忆度: {Math.round(retrievability)}%
                </span>
              )}
            </div>
            
            <h2 className="text-5xl font-bold text-gray-800 mb-4">{word.word}</h2>
            
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Volume2 className="w-6 h-6" />
              <span className="text-lg">{word.phonetic}</span>
            </button>
            
            <p className="text-gray-500 mt-8 text-center">
              点击卡片查看释义
            </p>
          </div>
          
          <div className="card-back bg-gradient-to-br from-primary-500 to-purple-600 text-white p-8 overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-bold">{word.word}</h3>
              <div className="flex gap-2">
                <button onClick={handleSpeak} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <Volume2 className="w-5 h-5" />
                </button>
                {showControls && (
                  <button onClick={handleStar} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <Star className={`w-5 h-5 ${progress.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-xl mb-2 opacity-90">{word.phonetic}</p>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-wide opacity-75 mb-2">释义</h4>
              <p className="text-lg">{word.definition}</p>
            </div>
            
            {word.example && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide opacity-75 mb-2">例句</h4>
                <p className="text-white/90 italic">"{word.example}"</p>
                {word.exampleTranslation && (
                  <p className="text-white/70 mt-1">{word.exampleTranslation}</p>
                )}
              </div>
            )}
            
            {progress.repetitions > 0 && (
              <div className="mb-6 p-4 bg-white/10 rounded-lg">
                <h4 className="text-sm font-semibold uppercase tracking-wide opacity-75 mb-2">学习进度</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{progress.repetitions}</p>
                    <p className="text-xs opacity-75">复习次数</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{progress.interval}天</p>
                    <p className="text-xs opacity-75">下次间隔</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{progress.easeFactor.toFixed(2)}</p>
                    <p className="text-xs opacity-75">难度系数</p>
                  </div>
                </div>
              </div>
            )}
            
            {showControls && (
              <div className="space-y-4">
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  >
                    {showNotes ? <BookOpen className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    <span className="text-sm">{showNotes ? '收起笔记' : '添加笔记/助记'}</span>
                  </button>
                  
                  {showNotes && (
                    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="w-4 h-4" /> 个人笔记
                        </label>
                        {editingField === 'notes' ? (
                          <div className="flex gap-2">
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="flex-1 p-2 rounded-lg bg-white/20 text-white placeholder-white/50 resize-none"
                              rows={2}
                              placeholder="记录你的笔记..."
                              autoFocus
                            />
                            <button
                              onClick={handleSaveNotes}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-sm"
                            >
                              保存
                            </button>
                          </div>
                        ) : (
                          <p
                            onClick={() => setEditingField('notes')}
                            className="p-2 rounded-lg bg-white/10 min-h-[40px] cursor-pointer hover:bg-white/20"
                          >
                            {progress.notes || <span className="text-white/50">点击添加笔记...</span>}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                          <Lightbulb className="w-4 h-4" /> 助记联想
                        </label>
                        {editingField === 'mnemonic' ? (
                          <div className="flex gap-2">
                            <textarea
                              value={mnemonic}
                              onChange={(e) => setMnemonic(e.target.value)}
                              className="flex-1 p-2 rounded-lg bg-white/20 text-white placeholder-white/50 resize-none"
                              rows={2}
                              placeholder="添加助记方法..."
                              autoFocus
                            />
                            <button
                              onClick={handleSaveMnemonic}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-sm"
                            >
                              保存
                            </button>
                          </div>
                        ) : (
                          <p
                            onClick={() => setEditingField('mnemonic')}
                            className="p-2 rounded-lg bg-white/10 min-h-[40px] cursor-pointer hover:bg-white/20"
                          >
                            {progress.mnemonic || <span className="text-white/50">点击添加助记联想...</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
