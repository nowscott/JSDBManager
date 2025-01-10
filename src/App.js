import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import Editor from './components/Editor';
import SymbolList from './components/SymbolList';
import { readJSFile } from './utils/fileHandler';
import { pinyin } from 'pinyin-pro';
import './styles.css';
import { v4 as uuidv4 } from 'uuid';
import stringify from 'json-stringify-pretty-compact';

const App = () => {
  const [data, setData] = useState({ symbols: [] });
  const [currentSymbol, setCurrentSymbol] = useState(null);

  const handleFileUpload = async (file) => {
    try {
      const parsedData = await readJSFile(file);
      if (parsedData && parsedData.symbols) {
        setData(parsedData);
      } else {
        throw new Error('数据格式不正确');
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      alert('文件解析失败: ' + error.message);
    }
  };

  const handleDownload = () => {
    const content = `module.exports = ${stringify(data, {
      indent: 2,
      maxLength: 160,
      arrayMargins: false
    })};`;

    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSymbolSelect = (symbol) => {
    setCurrentSymbol(symbol);
  };

  const handleSymbolSave = (symbolData) => {
    const newSymbols = [...data.symbols];
    const index = newSymbols.findIndex(s => s.id === symbolData.id);
    
    if (index >= 0) {
      newSymbols[index] = symbolData;
    } else {
      newSymbols.push({
        ...symbolData,
        id: String(Date.now())
      });
    }
    
    setData({ ...data, symbols: newSymbols });
    setCurrentSymbol(null);
  };

  const handleAddPinyin = () => {
    const newSymbols = data.symbols.map(symbol => {
      const pinyinTerms = symbol.searchTerms
        .filter(term => /[\u4e00-\u9fa5]/.test(term))
        .map(term => {
          return pinyin(term, { 
            toneType: 'none',
            type: 'string',
            separator: ''
          });
        });

      const newSearchTerms = [...new Set([...symbol.searchTerms, ...pinyinTerms])];

      return {
        ...symbol,
        searchTerms: newSearchTerms
      };
    });

    setData({ ...data, symbols: newSymbols });
  };

  const handleRegenerateIds = () => {
    const newSymbols = data.symbols.map(symbol => ({
      ...symbol,
      id: uuidv4()
    }));
    
    setData({ ...data, symbols: newSymbols });
  };

  const sortSymbolsByCategory = (result) => {
    // 首先统计每个类别的符号数量
    const categoryCount = {};
    result.forEach(symbol => {
      const category = (symbol.category && symbol.category[0]) || '';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return result.sort((a, b) => {
      const categoryA = (a.category && a.category[0]) || '';
      const categoryB = (b.category && b.category[0]) || '';
      
      if (categoryA !== categoryB) {
        // 不同类别，先按符号数量排序（从多到少）
        const countDiff = categoryCount[categoryB] - categoryCount[categoryA];
        // 如果数量相同，则按类别名称排序
        return countDiff !== 0 ? countDiff : categoryA.localeCompare(categoryB);
      }
      
      // 同类别内按符号的 Unicode 排序
      return a.symbol.localeCompare(b.symbol);
    });
  };

  const sortSymbolsByNotesLength = (result) => {
    return result.sort((a, b) => {
      const aLength = (a.notes || '').length;
      const bLength = (b.notes || '').length;
      return aLength - bLength;
    });
  };

  const handleSort = (sortType = 'notes') => {
    if (!data.symbols) return;
    
    const sortedSymbols = sortType === 'notes' 
      ? sortSymbolsByNotesLength([...data.symbols])
      : sortSymbolsByCategory([...data.symbols]);
      
    setData(prev => ({
      ...prev,
      symbols: sortedSymbols
    }));
  };

  const handleExportJson = () => {
    const content = stringify(data, {
      indent: 2,
      maxLength: 160,
      arrayMargins: false
    });

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadFromApi = async () => {
    try {
      const response = await fetch('/api/data.json');
      if (!response.ok) {
        throw new Error('API 请求失败');
      }
      const apiData = await response.json();
      setData(apiData);
    } catch (error) {
      console.error('从 API 加载失败:', error);
      alert('从 API 加载失败: ' + error.message);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>JSDBManager</h1>
      </header>
      
      <FileUploader 
        onUpload={handleFileUpload} 
        onDownload={handleDownload}
        onAddPinyin={handleAddPinyin}
        onRegenerateIds={handleRegenerateIds}
        onSort={handleSort}
        onExportJson={handleExportJson}
        onLoadFromApi={loadFromApi}
        data={data}
      />
      
      <div className="content-wrapper">
        <Editor 
          symbol={currentSymbol} 
          onSave={handleSymbolSave}
        />
        <SymbolList 
          symbols={data.symbols}
          onSelect={handleSymbolSelect}
          currentSymbolId={currentSymbol?.id}
        />
      </div>
    </div>
  );
};

export default App; 