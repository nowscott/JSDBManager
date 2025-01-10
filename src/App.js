import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import Editor from './components/Editor';
import SymbolList from './components/SymbolList';
import { readJSFile } from './utils/fileHandler';
import { pinyin } from 'pinyin-pro';
import './styles.css';
import { v4 as uuidv4 } from 'uuid';

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
    let content = JSON.stringify(data, null, 2);
    
    content = content.replace(/\[\n\s+(".*?"(?:,\n\s+".*?")*)\n\s+\]/g, '[$1]');
    
    content = `module.exports = ${content};`;

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

  const sortSymbols = (result) => {
    return result.sort((a, b) => {
      const aLength = (a.notes || '').length;
      const bLength = (b.notes || '').length;
      
      return aLength - bLength;
    });
  };

  const handleSort = () => {
    if (!data.symbols) return;
    const sortedSymbols = sortSymbols([...data.symbols]);
    setData(prev => ({
      ...prev,
      symbols: sortedSymbols
    }));
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