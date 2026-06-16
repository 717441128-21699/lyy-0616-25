import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { Word, ImportPreviewItem } from '../types';

interface DeckImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (name: string, words: Word[]) => void;
}

const CSV_COLUMN_HINTS = [
  { name: 'word', label: '单词', required: true, example: 'abandon' },
  { name: 'phonetic', label: '音标', required: false, example: '/əˈbændən/' },
  { name: 'definition', label: '释义', required: true, example: 'v. 放弃；抛弃' },
  { name: 'example', label: '例句', required: false, example: 'He abandoned his family.' },
  { name: 'exampleTranslation', label: '例句翻译', required: false, example: '他抛弃了他的家庭。' },
];

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === '\t' || char === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
};

const detectColumnMapping = (headers: string[]): Record<string, number> => {
  const mapping: Record<string, number> = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  const columnAliases: Record<string, string[]> = {
    word: ['单词', 'word', '词汇', 'term', '英文', 'english'],
    phonetic: ['音标', 'phonetic', '发音', 'pronunciation', 'ipa'],
    definition: ['释义', 'definition', '意思', '中文', 'translation', 'meaning', '译'],
    example: ['例句', 'example', '句子', 'sentence'],
    exampleTranslation: ['例句翻译', 'translation', '中文例句', 'exampletanslation', '译句'],
  };

  Object.entries(columnAliases).forEach(([field, aliases]) => {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (aliases.some(a => lowerHeaders[i].includes(a))) {
        mapping[field] = i;
        break;
      }
    }
  });

  return mapping;
};

const validateWord = (word: Partial<Word>): string[] => {
  const errors: string[] = [];
  if (!word.word || word.word.trim().length === 0) {
    errors.push('单词不能为空');
  } else if (word.word.length > 100) {
    errors.push('单词长度不能超过100个字符');
  }
  if (!word.definition || word.definition.trim().length === 0) {
    errors.push('释义不能为空');
  } else if (word.definition.length > 500) {
    errors.push('释义长度不能超过500个字符');
  }
  return errors;
};

const generateId = (): string => {
  return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export const DeckImportModal: React.FC<DeckImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [deckName, setDeckName] = useState('我的词库');
  const [textInput, setTextInput] = useState('');
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [hasHeader, setHasHeader] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validWords = useMemo(() =>
    preview.filter(p => p.isValid && p.word).map(p => p.word!),
    [preview]
  );

  const invalidItems = useMemo(() =>
    preview.filter(p => !p.isValid),
    [preview]
  );

  const resetState = useCallback(() => {
    setDeckName('我的词库');
    setTextInput('');
    setPreview([]);
    setStep('input');
    setColumnMapping({});
    setShowAdvanced(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const doParse = useCallback((input: string, overrideMapping?: Record<string, number>, useOverride: boolean = false) => {
    const lines = input.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      setPreview([]);
      setStep('input');
      return;
    }

    const delimiter = detectDelimiter(input);
    let startIdx = 0;
    let mapping: Record<string, number> = {};

    if (useOverride && overrideMapping && Object.keys(overrideMapping).length > 0) {
      mapping = { ...overrideMapping };
      if (hasHeader) startIdx = 1;
    } else if (hasHeader) {
      const headerLine = parseCSVLine(lines[0]);
      mapping = detectColumnMapping(headerLine);
      if (Object.keys(mapping).length > 0) {
        startIdx = 1;
      }
    }

    if (Object.keys(mapping).length === 0) {
      mapping = {
        word: 0,
        phonetic: 1,
        definition: 2,
        example: 3,
        exampleTranslation: 4,
      };
    }

    if (!useOverride) {
      setColumnMapping(mapping);
    }

    const items: ImportPreviewItem[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const lineNumber = i + 1;
      const raw = lines[i];
      const fields = delimiter === 'csv' || delimiter === 'unknown'
        ? parseCSVLine(raw)
        : raw.split('\t').map(f => f.trim());

      const wordData: Partial<Word> = {
        id: generateId(),
        word: getField(fields, mapping, 'word'),
        phonetic: getField(fields, mapping, 'phonetic'),
        definition: getField(fields, mapping, 'definition'),
        example: getField(fields, mapping, 'example'),
        exampleTranslation: getField(fields, mapping, 'exampleTranslation'),
      };

      const errors = validateWord(wordData);

      items.push({
        lineNumber,
        isValid: errors.length === 0,
        errors,
        word: errors.length === 0 ? wordData as Word : undefined,
        raw,
      });
    }

    setPreview(items);
    setStep('preview');
  }, [hasHeader]);

  const parseInput = useCallback((input: string) => {
    doParse(input, undefined, false);
  }, [doParse]);

  const detectDelimiter = (text: string): 'tsv' | 'csv' | 'unknown' => {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const tabs = (firstLine.match(/\t/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;

    if (tabs >= 2 && tabs > commas) return 'tsv';
    if (commas >= 2) return 'csv';
    return 'unknown';
  };

  const getField = (fields: string[], mapping: Record<string, number>, key: string): string => {
    const idx = mapping[key];
    if (idx === undefined || idx < 0 || idx >= fields.length) return '';
    return fields[idx] || '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(f =>
      f.name.toLowerCase().endsWith('.csv') ||
      f.name.toLowerCase().endsWith('.txt') ||
      f.name.toLowerCase().endsWith('.tsv')
    );

    if (csvFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) || '';
        setTextInput(text);
        if (!deckName || deckName === '我的词库') {
          const name = csvFile.name.replace(/\.(csv|txt|tsv)$/i, '');
          setDeckName(name);
        }
        setTimeout(() => parseInput(text), 50);
      };
      reader.readAsText(csvFile, 'UTF-8');
    }
  }, [deckName, parseInput]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) || '';
        setTextInput(text);
        if (!deckName || deckName === '我的词库') {
          const name = file.name.replace(/\.(csv|txt|tsv)$/i, '');
          setDeckName(name);
        }
        setTimeout(() => parseInput(text), 50);
      };
      reader.readAsText(file, 'UTF-8');
    }
  }, [deckName, parseInput]);

  const handleConfirmImport = () => {
    if (validWords.length === 0) return;
    onImport(deckName || '我的词库', validWords);
    handleClose();
  };

  const updateFieldMapping = (field: string, index: number) => {
    const newMapping = {
      ...columnMapping,
      [field]: index,
    };
    setColumnMapping(newMapping);
    setTimeout(() => {
      doParse(textInput, newMapping, true);
    }, 30);
  };



  const sampleCSV = `单词,音标,释义,例句,例句翻译
abandon,/əˈbændən/,v. 放弃；抛弃,"He abandoned his family.",他抛弃了他的家庭。
ability,/əˈbɪləti/,n. 能力；才能,"She has the ability to succeed.",她有成功的能力。`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-bounce-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">导入词库</h2>
              <p className="text-sm text-gray-500">
                {step === 'input' ? '选择文件或粘贴内容' : `预览：${validWords.length}个有效 / ${invalidItems.length}个无效`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {step === 'input' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">词库名称</label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="请输入词库名称"
              />
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileText className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
              <p className="font-medium text-gray-700 mb-1">
                {dragOver ? '释放文件开始导入' : '拖拽文件到此处 或 点击选择'}
              </p>
              <p className="text-sm text-gray-500">支持 CSV / TXT / TSV 格式</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  或粘贴内容（每行一个单词）
                </label>
                <button
                  onClick={() => { setTextInput(sampleCSV); }}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  加载示例
                </button>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`格式一（CSV）：\n单词,音标,释义,例句,例句翻译\nabandon,/əˈbændən/,v. 放弃,He left.,他离开了。\n\n格式二（制表符）：\nabandon\t/əˈbændən/\tv. 放弃`}
                className="w-full h-48 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none font-mono text-sm"
              />
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-700">高级设置</span>
                {showAdvanced
                  ? <ChevronUp className="w-5 h-5 text-gray-500" />
                  : <ChevronDown className="w-5 h-5 text-gray-500" />
                }
              </button>

              {showAdvanced && (
                <div className="p-4 pt-0 space-y-3 border-t border-gray-100 bg-gray-50">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => {
                        setHasHeader(e.target.checked);
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">首行为列标题（自动识别）</span>
                  </label>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">列字段映射</p>
                    <p className="text-xs text-gray-500 mb-2">
                      修改后会立即更新预览。列索引从 0 开始（0=第一列，1=第二列...）
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {CSV_COLUMN_HINTS.map(col => (
                        <div key={col.name} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-20 shrink-0">
                            {col.label}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={columnMapping[col.name] ?? ''}
                            onChange={(e) => updateFieldMapping(col.name, parseInt(e.target.value) || 0)}
                            className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none"
                            placeholder="列索引"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors bg-gray-50"
              >
                <span className="font-medium text-gray-700 text-sm">调整列映射（点击展开）</span>
                {showAdvanced
                  ? <ChevronUp className="w-4 h-4 text-gray-500" />
                  : <ChevronDown className="w-4 h-4 text-gray-500" />
                }
              </button>

              {showAdvanced && (
                <div className="p-4 space-y-3 border-t border-gray-100 bg-white">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => {
                        setHasHeader(e.target.checked);
                        setTimeout(() => {
                          if (e.target.checked) {
                            parseInput(textInput);
                          } else {
                            doParse(textInput, columnMapping, true);
                          }
                        }, 30);
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">首行为列标题</span>
                  </label>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      修改后立即刷新预览。列索引从 0 开始
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {CSV_COLUMN_HINTS.map(col => (
                        <div key={col.name} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-20 shrink-0">
                            {col.label}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={columnMapping[col.name] ?? ''}
                            onChange={(e) => updateFieldMapping(col.name, parseInt(e.target.value) || 0)}
                            className="flex-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none"
                            placeholder="列索引"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {validWords.length > 0 && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    可导入 {validWords.length} 个单词
                  </span>
                </div>
              </div>
            )}

            {invalidItems.length > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">
                    {invalidItems.length} 行格式有误（已跳过，不影响其他单词）
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {invalidItems.slice(0, 10).map(item => (
                    <div key={item.lineNumber} className="flex items-start gap-2 text-xs text-red-700">
                      <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                        第{item.lineNumber}行
                      </span>
                      <div>
                        <span className="opacity-70">{item.errors.join('；')}</span>
                        <code className="block text-red-600 mt-0.5 truncate max-w-xs">
                          {item.raw}
                        </code>
                      </div>
                    </div>
                  ))}
                  {invalidItems.length > 10 && (
                    <p className="text-xs text-red-600 opacity-70">还有 {invalidItems.length - 10} 条错误...</p>
                  )}
                </div>
              </div>
            )}

            {validWords.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">导入预览（前10个）</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">单词</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">音标</th>
                        <th className="text-left py-2 px-3 text-gray-600 font-medium">释义</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validWords.slice(0, 10).map((word, idx) => (
                        <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-800">{word.word}</td>
                          <td className="py-2 px-3 text-gray-500">{word.phonetic}</td>
                          <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{word.definition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100">
          {step === 'preview' ? (
            <button
              onClick={() => setStep('input')}
              className="px-5 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              返回修改
            </button>
          ) : (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Download className="w-4 h-4" />
              支持 CSV、TXT、TSV 文件格式
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>

            {step === 'input' ? (
              <button
                disabled={!textInput.trim()}
                onClick={() => parseInput(textInput)}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                下一步预览
              </button>
            ) : (
              <button
                disabled={validWords.length === 0}
                onClick={handleConfirmImport}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                确认导入 ({validWords.length}个)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
