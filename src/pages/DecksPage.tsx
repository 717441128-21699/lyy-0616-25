import React, { useState, useRef } from 'react';
import { Book, Plus, Trash2, Upload, Check, GraduationCap, Globe, Award, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { parseCustomDeck } from '../data/decks';

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
  const [importName, setImportName] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getDeckProgress = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return { learned: 0, total: 0, mastered: 0 };
    
    let learned = 0;
    let mastered = 0;
    
    deck.words.forEach(word => {
      const progress = wordProgress[word.id];
      if (progress && progress.repetitions > 0) {
        learned++;
        if (progress.proficiency === 'mastered') {
          mastered++;
        }
      }
    });
    
    return { learned, total: deck.words.length, mastered };
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportContent(content);
    };
    reader.readAsText(file);
  };
  
  const handleImport = () => {
    setImportError('');
    
    if (!importName.trim()) {
      setImportError('请输入词库名称');
      return;
    }
    
    if (!importContent.trim()) {
      setImportError('请输入或上传单词内容');
      return;
    }
    
    const words = parseCustomDeck(importContent);
    
    if (words.length === 0) {
      setImportError('未解析到有效的单词数据，请检查格式');
      return;
    }
    
    addCustomDeck(importName.trim(), words);
    setShowImport(false);
    setImportName('');
    setImportContent('');
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
                  <div className="absolute top-4 right-4">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                )}
                
                {deck.category === 'custom' && (
                  <button
                    onClick={(e) => handleRemoveDeck(deck.id, e)}
                    className="absolute top-4 right-14 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[deck.category]} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">{deck.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{deck.description}</p>
                
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
        
        {showImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">导入自定义词库</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  词库名称
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：我的专业词汇"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传单词文件
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    选择文件
                  </button>
                  <span className="text-gray-500 text-sm self-center">
                    支持 .txt 或 .csv 格式
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单词内容
                </label>
                <textarea
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={8}
                  placeholder="每行一个单词，格式如下（用制表符分隔）：
单词&#9;音标&#9;释义&#9;例句&#9;例句翻译
例如：
abandon&#9;/əˈbændən/&#9;v. 放弃，抛弃&#9;He abandoned his car.&#9;他抛弃了他的车。"
                />
              </div>
              
              {importError && (
                <p className="text-red-500 text-sm mb-4">{importError}</p>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportName('');
                    setImportContent('');
                    setImportError('');
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  导入词库
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
