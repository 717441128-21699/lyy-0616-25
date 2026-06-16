import React, { useState, useRef } from 'react';
import {
  Settings,
  Volume2,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Moon,
  Sun,
  Smartphone,
  Trash2,
  BookOpen,
  Target,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const SettingsPage: React.FC = () => {
  const {
    userSettings,
    updateSettings,
    getExportData,
    importData,
    syncData,
    userProgress,
  } = useStore();
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCode, setSyncCode] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExport = () => {
    const data = getExportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab-memory-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('success', '数据导出成功！');
  };
  
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const success = importData(importContent);
    if (success) {
      showMessage('success', '数据导入成功！');
      setShowImportModal(false);
      setImportContent('');
    } else {
      showMessage('error', '导入失败，请检查文件格式');
    }
  };
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };
  
  const generateSyncCode = () => {
    const data = syncData();
    if (data) {
      const json = JSON.stringify(data);
      const base64 = btoa(encodeURIComponent(json));
      setSyncCode(base64);
      setSyncMessage('');
    }
  };
  
  const handleSync = () => {
    try {
      const json = decodeURIComponent(atob(syncCode));
      const data = JSON.parse(json);
      const result = syncData(data);
      
      if (result === null) {
        showMessage('success', '同步成功！数据已合并');
        setShowSyncModal(false);
        setSyncCode('');
        setSyncMessage('');
      } else {
        const newerJson = JSON.stringify(result);
        const newerBase64 = btoa(encodeURIComponent(newerJson));
        setSyncCode(newerBase64);
        setSyncMessage('本地数据更新，使用新的同步码');
      }
    } catch (e) {
      showMessage('error', '同步码无效，请检查');
    }
  };
  
  const handleCopySyncCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };
  
  const handleResetData = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      localStorage.removeItem('vocab-memory-storage');
      window.location.reload();
    }
  };
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">设置</h1>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              学习设置
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每日新学单词数
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={userSettings.dailyNewWords}
                    onChange={(e) => updateSettings({ dailyNewWords: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <span className="w-12 text-center font-semibold text-primary-600">
                    {userSettings.dailyNewWords}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每日复习单词数
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={userSettings.dailyReviewWords}
                    onChange={(e) => updateSettings({ dailyReviewWords: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <span className="w-12 text-center font-semibold text-primary-600">
                    {userSettings.dailyReviewWords}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">自动播放发音</span>
                </div>
                <button
                  onClick={() => updateSettings({ autoPlayAudio: !userSettings.autoPlayAudio })}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    userSettings.autoPlayAudio ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      userSettings.autoPlayAudio ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {userSettings.darkMode ? (
                    <Moon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-gray-700">深色模式</span>
                </div>
                <button
                  onClick={() => updateSettings({ darkMode: !userSettings.darkMode })}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    userSettings.darkMode ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      userSettings.darkMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary-500" />
              多设备同步
            </h3>
            
            <p className="text-gray-500 text-sm mb-4">
              使用同步码在不同设备之间同步学习进度。生成同步码后，在另一台设备上输入即可同步。
            </p>
            
            <button
              onClick={() => {
                setShowSyncModal(true);
                setSyncCode('');
                setSyncMessage('');
              }}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              开始同步
            </button>
            
            <p className="text-xs text-gray-400 mt-2">
              设备 ID: {userSettings.syncDeviceId}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-primary-500" />
              数据管理
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                导出学习数据
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                导入学习数据
              </button>
              
              <button
                onClick={handleResetData}
                className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                重置所有数据
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              学习概览
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-xl">
                <p className="text-3xl font-bold text-primary-600">{userProgress.totalWordsLearned}</p>
                <p className="text-sm text-gray-600">累计学习单词</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{userProgress.streakDays}</p>
                <p className="text-sm text-gray-600">连续打卡天数</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{userProgress.totalReviews}</p>
                <p className="text-sm text-gray-600">总复习次数</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-3xl font-bold text-orange-600">{Math.round(userProgress.masteryRate * 100)}%</p>
                <p className="text-sm text-gray-600">掌握率</p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-white/60 text-sm py-4">
            <p>单词记忆系统 v1.0.0</p>
            <p className="mt-1">基于 SM-2 间隔重复算法</p>
          </div>
        </div>
      </div>
      
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full animate-bounce-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">多设备同步</h2>
            
            {syncMessage && (
              <p className="text-yellow-600 text-sm mb-4">{syncMessage}</p>
            )}
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                1. 点击下方按钮生成本地数据的同步码
              </p>
              <button
                onClick={generateSyncCode}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                生成同步码
              </button>
            </div>
            
            {syncCode && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  2. 复制同步码到另一台设备
                </p>
                <div className="relative">
                  <textarea
                    value={syncCode}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono resize-none h-24"
                  />
                  <button
                    onClick={handleCopySyncCode}
                    className="absolute top-2 right-2 p-2 text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                3. 或输入从其他设备获取的同步码
              </p>
              <textarea
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono resize-none h-24"
                placeholder="粘贴同步码..."
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncCode('');
                  setSyncMessage('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSync}
                disabled={!syncCode}
                className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                同步数据
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">导入学习数据</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">选择备份文件 (.json)</p>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  选择文件
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">或粘贴 JSON 数据</p>
              <textarea
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono resize-none h-40"
                placeholder="粘贴 JSON 数据..."
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportContent('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={!importContent.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                导入数据
              </button>
            </div>
          </div>
        </div>
      )}
      
      {message && (
        <div
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-semibold animate-bounce-in ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};
