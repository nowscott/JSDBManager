import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import SymbolList from './components/SymbolList';
import { pinyin } from 'pinyin-pro';
import './styles/index.css';
import stringify from 'json-stringify-pretty-compact';
import SystemRangeManager from './components/SystemRangeManager';
import NavBar from './components/NavBar';




const App = () => {
  const [data, setData] = useState({ 
    version: "1.0.0",
    systemRanges: {
      ios: [],
      android: [],
      win: [],
      mac: []
    },
    symbols: [] 
  });
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRangeManagerOpen, setIsRangeManagerOpen] = useState(false);
  useEffect(() => {
    // 初始化空数据
    setIsLoading(false);
  }, []);

  // 添加暗色模式检测
  useEffect(() => {
    // 检测系统是否支持暗色模式
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 当系统颜色模式改变时更新样式
    const handleColorSchemeChange = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };

    // 初始化检测
    handleColorSchemeChange(darkModeMediaQuery);

    // 添加监听器
    darkModeMediaQuery.addListener(handleColorSchemeChange);

    // 清理监听器
    return () => darkModeMediaQuery.removeListener(handleColorSchemeChange);
  }, []);



  // 修改版本更新函数
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
    
    const newData = {
      ...data,
      version: newVersion
    };
    setData(newData);
  };

  const handleFileUpload = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          let newData;
          
          // 检测数据格式类型
          if (jsonData && jsonData.symbols) {
            // 符号数据格式
            const version = (jsonData.version || "1.0.0").replace(/-beta$/, '');
            
            newData = {
              version: version,
              systemRanges: jsonData.systemRanges || {
                ios: [],
                android: [],
                win: [],
                mac: []
              },
              symbols: jsonData.symbols.map(({ id, description, ...symbol }) => ({
                symbol: symbol.symbol,
                name: symbol.name || description,
                pronunciation: symbol.pronunciation || '',
                category: symbol.category || [],
                searchTerms: symbol.searchTerms || [],
                notes: symbol.notes || ''
              }))
            };
          } else if (jsonData && (jsonData.emojis || jsonData.data || Array.isArray(jsonData))) {
            // 表情数据格式
            const emojiArray = jsonData.emojis || jsonData.data || jsonData;
            
            newData = {
              version: jsonData.version || "1.0.0",
              systemRanges: {
                ios: [],
                android: [],
                win: [],
                mac: []
              },
              symbols: emojiArray.map(emoji => ({
                symbol: emoji.emoji || emoji.unicode || emoji.char,
                name: emoji.name || emoji.annotation || emoji.description,
                pronunciation: '',
                category: emoji.category ? [emoji.category] : (emoji.group ? [emoji.group] : []),
                searchTerms: emoji.keywords || emoji.tags || [],
                notes: emoji.text || emoji.shortcode || ''
              }))
            };
          } else {
            throw new Error('数据格式不正确，请确保文件包含符号数据或表情数据');
          }
          
          setData(newData);
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

  // 修改符号保存函数
  const handleSymbolSave = (symbolData) => {
    let newSymbols;
    if (currentSymbol) {  // 如果是编辑现有符号
      newSymbols = data.symbols.map(s => 
        s.symbol === currentSymbol.symbol ? symbolData : s
      );
    } else {  // 如果是添加新符号
      newSymbols = [...data.symbols, symbolData];
    }
    
    const newData = {
      ...data,
      symbols: newSymbols
    };
    updateDataAndCache(newData);
    setCurrentSymbol(null);
  };

  // 修改拼音添加函数
  const handleAddPinyin = () => {
    const newSymbols = data.symbols.map(symbol => {
      const pinyinTerms = symbol.searchTerms
        .filter(term => /[\u4e00-\u9fa5]/.test(term))
        .map(term => pinyin(term, { 
          toneType: 'none',
          type: 'string',
          separator: ''
        }));

      const newSearchTerms = [...new Set([...symbol.searchTerms, ...pinyinTerms])];
      return {
        ...symbol,
        searchTerms: newSearchTerms
      };
    });

    updateDataAndCache({ ...data, symbols: newSymbols });
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

  // 修改排序函数
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
    
    updateDataAndCache({
      ...data,
      symbols: sortedSymbols
    });
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

  const handleExportJson = (isBeta = false) => {
    // 先对符号进行去重，保留内容更丰富的记录
    const symbolMap = new Map();
    
    data.symbols.forEach(symbol => {
      const existingSymbol = symbolMap.get(symbol.symbol);
      
      if (!existingSymbol) {
        symbolMap.set(symbol.symbol, symbol);
      } else {
        const existingScore = getSymbolContentScore(existingSymbol);
        const newScore = getSymbolContentScore(symbol);
        
        if (newScore > existingScore) {
          symbolMap.set(symbol.symbol, symbol);
        }
      }
    });

    let sortedData;
    let defaultFileName;
    
    // 准备导出数据
    sortedData = {
      version: isBeta ? `${data.version}-beta` : data.version,
      systemRanges: data.systemRanges,
      symbols: Array.from(symbolMap.values()).map(({ id, description, ...symbol }) => ({
        symbol: symbol.symbol,
        name: symbol.name,
        pronunciation: symbol.pronunciation,
        category: symbol.category,
        searchTerms: symbol.searchTerms,
        notes: symbol.notes
      }))
    };
    defaultFileName = isBeta ? 'data-beta.json' : 'data.json';

    // 提供三个文件名选项
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    const fileNameOptions = [
      defaultFileName,
      `${defaultFileName.replace('.json', '')}-${currentDate}.json`,
      `symbols-v${data.version}${isBeta ? '-beta' : ''}.json`
    ];

    // 创建选择对话框
    const selectedFileName = prompt(
      `请选择导出文件名：\n\n1. ${fileNameOptions[0]}\n2. ${fileNameOptions[1]}\n3. ${fileNameOptions[2]}\n\n请输入数字 1、2 或 3（或直接输入自定义文件名）：`,
      '1'
    );

    if (selectedFileName === null) {
      return; // 用户取消了导出
    }

    let finalFileName;
    if (selectedFileName === '1') {
      finalFileName = fileNameOptions[0];
    } else if (selectedFileName === '2') {
      finalFileName = fileNameOptions[1];
    } else if (selectedFileName === '3') {
      finalFileName = fileNameOptions[2];
    } else {
      // 用户输入了自定义文件名
      finalFileName = selectedFileName.endsWith('.json') ? selectedFileName : selectedFileName + '.json';
    }

    const content = stringify(sortedData, {
      indent: 2,
      maxLength: 160,
      arrayMargins: false
    });

    // 导出文件
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
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
    
    // 检查是否是 Unicode 区间搜索
    const rangeMatch = searchTermLower.match(/([0-9a-f]{4,5})-([0-9a-f]{4,5})/i);
    // 检查是否是单个 Unicode 搜索
    const unicodeMatch = searchTermLower.match(/u\+?([0-9a-f]{4,})/i);
    
    return data.symbols.filter(symbol => {
      const symbolCode = symbol.symbol.codePointAt(0);
      
      // 如果是区间搜索
      if (rangeMatch) {
        const startCode = parseInt(rangeMatch[1], 16);
        const endCode = parseInt(rangeMatch[2], 16);
        return symbolCode >= startCode && symbolCode <= endCode;
      }
      
      // 如果是单个 Unicode 搜索
      if (unicodeMatch) {
        const searchCode = parseInt(unicodeMatch[1], 16);
        return symbolCode === searchCode;
      }
      
      // 常规搜索字段
      const searchFields = [
        symbol.symbol,
        symbol.name,
        ...(Array.isArray(symbol.category) ? symbol.category : [symbol.category]),
        ...(symbol.searchTerms || []),
        symbol.pronunciation || ''
      ];
      
      // Unicode 码点也作为搜索字段
      const unicodeStr = `U+${symbolCode.toString(16).toUpperCase().padStart(4, '0')}`;
      searchFields.push(unicodeStr);
      
      // 为每个中文字段生成拼音
      const pinyinFields = searchFields
        .filter(field => field && /[\u4e00-\u9fa5]/.test(field))
        .map(field => {
          const pinyinFull = pinyin(field, { 
            toneType: 'none', 
            type: 'string',
            separator: ' '
          });
          const pinyinFirst = pinyin(field, { 
            pattern: 'first', 
            toneType: 'none', 
            type: 'string'
          });
          const pinyinFullNoSpace = pinyinFull.replace(/\s+/g, '');
          return [pinyinFull, pinyinFirst, pinyinFullNoSpace];
        })
        .flat();
      
      // 合并所有可搜索的内容
      const allSearchableContent = [
        ...searchFields.map(field => (field || '').toLowerCase()),
        ...pinyinFields
      ];
      
      return allSearchableContent.some(content => 
        content.includes(searchTermLower) || 
        content.includes(searchTermLower.replace(/\s+/g, ''))
      );
    });
  };

  // 修改删除符号函数
  const handleDeleteSymbol = (symbolChar) => {
    const newSymbols = data.symbols.filter(s => s.symbol !== symbolChar);
    const newData = {
      ...data,
      symbols: newSymbols
    };
    
    updateDataAndCache(newData);
    
    if (currentSymbol && currentSymbol.symbol === symbolChar) {
      setCurrentSymbol(null);
    }
  };

  // 修改系统区间保存函数
  const handleSystemRangesSave = (newRanges) => {
    const newData = {
      ...data,
      systemRanges: newRanges
    };
    updateDataAndCache(newData);
  };

  const handleExportPinyinMap = () => {
    // 从名称、搜索关键词和类别中收集汉字
    const chineseChars = new Set();
    data.symbols.forEach(symbol => {
      // 从名称中收集汉字
      if (symbol.name) {
        [...symbol.name].forEach(char => {
          if (/[\u4e00-\u9fa5]/.test(char)) {
            chineseChars.add(char);
          }
        });
      }
      // 从搜索关键词中收集汉字
      if (symbol.searchTerms) {
        symbol.searchTerms.forEach(term => {
          [...term].forEach(char => {
            if (/[\u4e00-\u9fa5]/.test(char)) {
              chineseChars.add(char);
            }
          });
        });
      }
      // 从类别中收集汉字
      if (symbol.category) {
        const categories = Array.isArray(symbol.category) ? symbol.category : [symbol.category];
        categories.forEach(category => {
          if (category) {
            [...category].forEach(char => {
              if (/[\u4e00-\u9fa5]/.test(char)) {
                chineseChars.add(char);
              }
            });
          }
        });
      }
    });

    // 生成拼音映射
    const pinyinMap = {};
    Array.from(chineseChars).sort().forEach(char => {
      const py = pinyin(char, { 
        toneType: 'none',
        type: 'string',
        separator: ''
      });
      pinyinMap[char] = py;
    });

    // 创建包含版本号的数据结构
    const exportData = {
      version: data.version,
      pinyinMap: pinyinMap
    };

    // 生成 JSON 文件内容
    const content = JSON.stringify(exportData, null, 2);

    // 导出文件
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pinyin-map.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 添加重置搜索词函数
  const handleResetSearchTerms = () => {
    const newSymbols = data.symbols.map(symbol => ({
      ...symbol,
      searchTerms: []  // 清空搜索词
    }));

    const newData = {
      ...data,
      symbols: newSymbols
    };
    setData(newData);
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="container">
      <NavBar 
        onUpload={handleFileUpload}
        onExportJson={handleExportJson}
        onExportPinyinMap={handleExportPinyinMap}
        onOpenRangeManager={() => setIsRangeManagerOpen(true)}
        onResetSearchTerms={handleResetSearchTerms}
        onSort={handleSort}
        data={data}
        version={data.version}
        onUpdateVersion={updateVersion}
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

      <SystemRangeManager 
        isOpen={isRangeManagerOpen}
        onClose={() => setIsRangeManagerOpen(false)}
        systemRanges={data.systemRanges}
        onSave={handleSystemRangesSave}
      />
    </div>
  );
};

export default App;