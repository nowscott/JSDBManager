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
    
    let sortedSymbols;
    switch(sortType) {
      case 'notes':
        sortedSymbols = sortSymbolsByNotesLength([...data.symbols]);
        break;
      case 'category':
        sortedSymbols = sortSymbolsByCategory([...data.symbols]);
        break;
      case 'unicode':
        sortedSymbols = sortSymbolsByUnicode([...data.symbols]);
        break;
      default:
        sortedSymbols = [...data.symbols];
    }
    
    setData(prev => ({
      ...prev,
      symbols: sortedSymbols
    }));
  };

  const sortSymbolsByUnicode = (symbols) => {
    return symbols.sort((a, b) => {
      // 获取符号的 Unicode 码点
      const aCode = a.symbol.codePointAt(0) || 0;
      const bCode = b.symbol.codePointAt(0) || 0;
      
      // 如果码点相同，按名称排序
      if (aCode === bCode) {
        return (a.name || '').localeCompare(b.name || '');
      }
      
      return aCode - bCode;
    });
  };

  const handleExportJson = () => {
    // 先对符号进行去重，保留内容更丰富的记录
    const symbolMap = new Map();
    
    data.symbols.forEach(symbol => {
      const existingSymbol = symbolMap.get(symbol.symbol);
      
      if (!existingSymbol) {
        // 如果不存在，直接添加
        symbolMap.set(symbol.symbol, symbol);
      } else {
        // 如果存在，比较内容的丰富程度
        const existingScore = getSymbolContentScore(existingSymbol);
        const newScore = getSymbolContentScore(symbol);
        
        // 保留得分更高的记录
        if (newScore > existingScore) {
          symbolMap.set(symbol.symbol, symbol);
        }
      }
    });

    // 创建一个带有属性排序的数据副本
    const sortedData = {
      version: data.version,
      symbols: Array.from(symbolMap.values()).map(({ description, ...symbol }) => ({
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

  // 添加一个函数来计算符号内容的丰富程度
  const getSymbolContentScore = (symbol) => {
    let score = 0;
    
    // 名称长度
    score += (symbol.name || '').length * 2;  // 名称权重更高
    
    // 读音
    score += (symbol.pronunciation || '').length;
    
    // 分类数量和长度
    if (Array.isArray(symbol.category)) {
      score += symbol.category.join('').length;
      score += symbol.category.length;  // 额外加分：每个分类加1分
    }
    
    // 搜索关键词数量和长度
    if (Array.isArray(symbol.searchTerms)) {
      score += symbol.searchTerms.join('').length;
      score += symbol.searchTerms.length;  // 额外加分：每个关键词加1分
    }
    
    // 备注长度
    score += (symbol.notes || '').length;
    
    return score;
  };

  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

  const getFilteredSymbols = () => {
    if (!searchTerm) return data.symbols;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // 检查是否是 Unicode 搜索
    const unicodeMatch = searchTermLower.match(/u\+?([0-9a-f]{4,})/i);
    
    return data.symbols.filter(symbol => {
      // 如果是 Unicode 搜索
      if (unicodeMatch) {
        const searchCode = parseInt(unicodeMatch[1], 16);
        const symbolCode = symbol.symbol.codePointAt(0);
        return symbolCode === searchCode;
      }
      
      // 常规搜索字段
      const searchFields = [
        symbol.symbol,
        symbol.name,
        ...(Array.isArray(symbol.category) ? symbol.category : [symbol.category]),
        ...(symbol.searchTerms || [])
      ];
      
      // Unicode 码点也作为搜索字段
      const unicodeStr = `U+${symbol.symbol.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
      searchFields.push(unicodeStr);
      
      // 为每个中文字段生成拼音
      const pinyinFields = searchFields
        .filter(field => field && /[\u4e00-\u9fa5]/.test(field))
        .map(field => {
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

  const handleDeleteSymbol = (symbolId) => {
    const newSymbols = data.symbols.filter(s => s.id !== symbolId);
    const newData = {
      ...data,
      symbols: newSymbols
    };
    
    setData(newData);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    
    // 如果删除的是当前选中的符号，清除选中状态
    if (currentSymbol && currentSymbol.id === symbolId) {
      setCurrentSymbol(null);
    }
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="header">
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
          onDelete={handleDeleteSymbol}
        />
      </div>
    </div>
  );
};

export default App; 