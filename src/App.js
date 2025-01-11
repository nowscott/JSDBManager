import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import Editor from './components/Editor';
import SymbolList from './components/SymbolList';
import { pinyin } from 'pinyin-pro';
import './styles.css';
import { v4 as uuidv4 } from 'uuid';
import stringify from 'json-stringify-pretty-compact';
import VersionControl from './components/VersionControl';

const CACHE_KEY = 'symbolData';
const CACHE_TIMESTAMP_KEY = 'symbolDataTimestamp';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟的缓存时间（毫秒）
const ORIGINAL_URL = 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const DATA_URL = CORS_PROXY + encodeURIComponent(ORIGINAL_URL);

const App = () => {
  const [data, setData] = useState({ 
    version: "1.0.0",
    symbols: [] 
  });
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 检查缓存
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      const currentTime = new Date().getTime();

      // 如果缓存存在且未过期
      if (cachedData && cachedTimestamp && 
          (currentTime - parseInt(cachedTimestamp)) < CACHE_DURATION) {
        const parsedData = JSON.parse(cachedData);
        // 为每个符号添加读音属性和名称属性
        parsedData.symbols = parsedData.symbols.map(symbol => ({
          ...symbol,
          pronunciation: symbol.pronunciation || '',
          name: symbol.name || symbol.description  // 如果没有 name，使用 description
        }));
        setData(parsedData);
        setIsLoading(false);
        return;
      }

      // 使用新的 CORS 代理获取数据
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const newData = await response.json();
      // 为每个符号添加读音属性，并删除描述属性
      newData.symbols = newData.symbols.map(({ description, ...symbol }) => ({
        ...symbol,
        pronunciation: '',
        name: symbol.name || description  // 如果没有 name，使用 description 的值
      }));
      
      // 更新数据和缓存
      setData(newData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, currentTime.toString());
      
    } catch (error) {
      console.error('Error loading data:', error);
      // 如果获取失败但有缓存，使用缓存的数据
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // 为缓存的数据也添加读音属性和名称属性
        parsedData.symbols = parsedData.symbols.map(symbol => ({
          ...symbol,
          pronunciation: symbol.pronunciation || '',
          name: symbol.name || symbol.description
        }));
        setData(parsedData);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    
    setData(prevData => ({
      ...prevData,
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
            // 为上传的数据添加必要的属性，删除描述属性
            jsonData.symbols = jsonData.symbols.map(({ description, ...symbol }) => ({
              ...symbol,
              pronunciation: symbol.pronunciation || '',
              name: symbol.name || description  // 如果没有 name，使用 description 的值
            }));
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
    let newSymbols;
    if (symbolData.id) {
      newSymbols = data.symbols.map(s => 
        s.id === symbolData.id ? symbolData : s
      );
    } else {
      symbolData.id = uuidv4();
      newSymbols = [...data.symbols, symbolData];
    }
    
    const newData = {
      ...data,
      symbols: newSymbols
    };
    
    setData(newData);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
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
    // 创建一个带有属性排序的数据副本，不包含 description
    const sortedData = {
      version: data.version,
      symbols: data.symbols.map(({ description, ...symbol }) => ({
        id: symbol.id,
        symbol: symbol.symbol,
        name: symbol.name,
        pronunciation: symbol.pronunciation,
        category: symbol.category,
        searchTerms: symbol.searchTerms,
        notes: symbol.notes
      }))
    };

    const content = stringify(sortedData, {
      indent: 2,
      maxLength: 160,
      arrayMargins: false
    });

    // 更新缓存
    localStorage.setItem(CACHE_KEY, content);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString());

    // 导出文件
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

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>符号数据管理器</h1>
        <VersionControl 
          version={data.version}
          onUpdate={updateVersion}
        />
      </div>
      
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