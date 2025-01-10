import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import Editor from './components/Editor';
import SymbolList from './components/SymbolList';
import { readJSFile } from './utils/fileHandler';
import { pinyin } from 'pinyin-pro';
import './styles.css';
import { v4 as uuidv4 } from 'uuid';
import stringify from 'json-stringify-pretty-compact';
import VersionControl from './components/VersionControl';

const App = () => {
  const [data, setData] = useState({ 
    version: "1.0.0",
    symbols: [] 
  });
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const updateVersion = (type) => {
    const [major, minor, patch] = data.version.split('.').map(Number);
    let newVersion;
    
    switch(type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        return;
    }
    
    setData(prev => ({
      ...prev,
      version: newVersion
    }));
  };

  const handleFileUpload = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          if (jsonData && jsonData.symbols) {
            if (!jsonData.version) {
              jsonData.version = "1.0.0";
            }
            setData(jsonData);
          } else {
            throw new Error('数据格式不正确');
          }
        } catch (error) {
          console.error('JSON 解析失败:', error);
          alert('JSON 解析失败: ' + error.message);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('文件读取失败:', error);
      alert('文件读取失败: ' + error.message);
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

  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

  const getFilteredSymbols = () => {
    if (!searchTerm) return data.symbols;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    return data.symbols.filter(symbol => {
      // 收集所有可搜索的字段
      const searchFields = [
        symbol.symbol,
        symbol.description,
        ...(Array.isArray(symbol.category) ? symbol.category : [symbol.category]),
        ...(symbol.searchTerms || [])
      ];
      
      // 为每个中文字段生成拼音
      const pinyinFields = searchFields
        .filter(field => field && /[\u4e00-\u9fa5]/.test(field))
        .map(field => {
          // 生成不同形式的拼音以支持更灵活的搜索
          const pinyinFull = pinyin(field, { toneType: 'none', type: 'string' });
          const pinyinFirst = pinyin(field, { 
            pattern: 'first', 
            toneType: 'none', 
            type: 'string' 
          });
          return [pinyinFull, pinyinFirst];
        })
        .flat();
      
      // 合并所有可搜索的内容
      const allSearchableContent = [
        ...searchFields.map(field => (field || '').toLowerCase()),
        ...pinyinFields
      ];
      
      // 检查是否有任何字段包含搜索词
      return allSearchableContent.some(content => content.includes(searchTermLower));
    });
  };

  return (
    <div className="container">
      <header className="header">
        <h1>JSDBManager</h1>
        <VersionControl 
          version={data.version} 
          onUpdate={updateVersion}
        />
      </header>
      
      <FileUploader 
        onUpload={handleFileUpload} 
        onDownload={handleDownload}
        onAddPinyin={handleAddPinyin}
        onRegenerateIds={handleRegenerateIds}
        onSort={handleSort}
        onExportJson={handleExportJson}
        data={data}
      />
      
      <div className="content-wrapper">
        <Editor 
          symbol={currentSymbol} 
          onSave={handleSymbolSave}
        />
        <SymbolList 
          symbols={getFilteredSymbols()}
          onSelect={handleSymbolSelect}
          currentSymbolId={currentSymbol?.id}
          onSearch={handleSearch}
        />
      </div>
    </div>
  );
};

export default App; 