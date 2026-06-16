import React, { useState, useMemo } from 'react';
import {
  X, Edit3, Trash2, Check, XCircle, Save, Plus, Search,
} from 'lucide-react';
import type { Word, Deck } from '../types';

interface DeckEditorModalProps {
  isOpen: boolean;
  deck: Deck | null;
  onClose: () => void;
  onUpdateWord: (wordId: string, updates: Partial<Word>) => void;
  onDeleteWords: (wordIds: string[]) => void;
  onAddWord: (word: Word) => void;
}

interface EditingState {
  wordId: string;
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  exampleTranslation: string;
}

const generateId = (): string => {
  return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export const DeckEditorModal: React.FC<DeckEditorModalProps> = ({
  isOpen,
  deck,
  onClose,
  onUpdateWord,
  onDeleteWords,
  onAddWord,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({
    word: '',
    phonetic: '',
    definition: '',
    example: '',
    exampleTranslation: '',
  });

  const filteredWords = useMemo(() => {
    if (!deck) return [];
    if (!searchQuery.trim()) return deck.words;
    const q = searchQuery.toLowerCase();
    return deck.words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q)
    );
  }, [deck, searchQuery]);

  const toggleSelect = (wordId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWords.map((w) => w.id)));
    }
  };

  const startEdit = (word: Word) => {
    setEditing({
      wordId: word.id,
      word: word.word,
      phonetic: word.phonetic,
      definition: word.definition,
      example: word.example,
      exampleTranslation: word.exampleTranslation,
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.word.trim() || !editing.definition.trim()) return;

    onUpdateWord(editing.wordId, {
      word: editing.word.trim(),
      phonetic: editing.phonetic.trim(),
      definition: editing.definition.trim(),
      example: editing.example.trim(),
      exampleTranslation: editing.exampleTranslation.trim(),
    });
    setEditing(null);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 个单词吗？`)) return;
    onDeleteWords(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleAddWord = () => {
    if (!newWord.word.trim() || !newWord.definition.trim()) return;
    const word: Word = {
      id: generateId(),
      word: newWord.word.trim(),
      phonetic: newWord.phonetic.trim(),
      definition: newWord.definition.trim(),
      example: newWord.example.trim(),
      exampleTranslation: newWord.exampleTranslation.trim(),
    };
    onAddWord(word);
    setNewWord({
      word: '',
      phonetic: '',
      definition: '',
      example: '',
      exampleTranslation: '',
    });
    setShowAddForm(false);
  };

  if (!isOpen || !deck) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-bounce-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              编辑词库：{deck.name}
            </h2>
            <p className="text-sm text-gray-500">
              共 {deck.words.length} 个单词，已选 {selectedIds.size} 个
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词或释义..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加单词
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            删除选中
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700 text-sm">添加新单词</h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">单词 *</label>
                <input
                  type="text"
                  value={newWord.word}
                  onChange={(e) => setNewWord((p) => ({ ...p, word: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="输入单词"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">音标</label>
                <input
                  type="text"
                  value={newWord.phonetic}
                  onChange={(e) => setNewWord((p) => ({ ...p, phonetic: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="/fəˈnetɪk/"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">释义 *</label>
                <input
                  type="text"
                  value={newWord.definition}
                  onChange={(e) => setNewWord((p) => ({ ...p, definition: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="单词的中文释义"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">例句</label>
                <input
                  type="text"
                  value={newWord.example}
                  onChange={(e) => setNewWord((p) => ({ ...p, example: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="英文例句"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">例句翻译</label>
                <input
                  type="text"
                  value={newWord.exampleTranslation}
                  onChange={(e) => setNewWord((p) => ({ ...p, exampleTranslation: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                  placeholder="例句中文翻译"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddWord}
                disabled={!newWord.word.trim() || !newWord.definition.trim()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                确认添加
              </button>
            </div>
          </div>
        )}

        {editing && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                编辑单词
              </h4>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">单词 *</label>
                <input
                  type="text"
                  value={editing.word}
                  onChange={(e) => setEditing({ ...editing, word: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">音标</label>
                <input
                  type="text"
                  value={editing.phonetic}
                  onChange={(e) => setEditing({ ...editing, phonetic: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">释义 *</label>
                <input
                  type="text"
                  value={editing.definition}
                  onChange={(e) => setEditing({ ...editing, definition: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">例句</label>
                <input
                  type="text"
                  value={editing.example}
                  onChange={(e) => setEditing({ ...editing, example: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">例句翻译</label>
                <input
                  type="text"
                  value={editing.exampleTranslation}
                  onChange={(e) => setEditing({ ...editing, exampleTranslation: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3 gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                disabled={!editing.word.trim() || !editing.definition.trim()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-10 py-3 px-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredWords.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="text-left py-3 px-3 text-gray-600 font-semibold text-sm">
                  单词
                </th>
                <th className="text-left py-3 px-3 text-gray-600 font-semibold text-sm">
                  释义
                </th>
                <th className="w-20 py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    {deck.words.length === 0 ? '这个词库还没有单词' : '没有找到匹配的单词'}
                  </td>
                </tr>
              ) : (
                filteredWords.map((word) => (
                  <tr
                    key={word.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selectedIds.has(word.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(word.id)}
                        onChange={() => toggleSelect(word.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-gray-800">{word.word}</span>
                      {word.phonetic && (
                        <span className="text-gray-400 text-sm ml-2">{word.phonetic}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-sm max-w-md truncate">
                      {word.definition}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(word)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除单词 "${word.word}" 吗？`)) {
                              onDeleteWords([word.id]);
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                next.delete(word.id);
                                return next;
                              });
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            显示 {filteredWords.length} / {deck.words.length} 个单词
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
