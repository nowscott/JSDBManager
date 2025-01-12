import React from 'react';
import SearchBar from './SearchBar';

const SymbolList = ({ symbols, onSelect, currentSymbolId, onSearch, onDelete }) => {
  const getUnicodeDisplay = (symbol) => {
    const codePoint = symbol.codePointAt(0);
    return codePoint ? `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}` : '';
  };

  return (
    <div className="symbol-list-section">
      <div className="symbol-list-header">
        <h2>符号列表</h2>
        <SearchBar onSearch={onSearch} />
      </div>
      <div className="symbol-list-content">
        {symbols.map(symbol => (
          <div 
            key={symbol.id}
            className={`symbol-list-item ${symbol.id === currentSymbolId ? 'active' : ''}`}
          >
            <div 
              className="symbol-content"
              onClick={() => onSelect(symbol)}
            >
              <div className="symbol-main">
                <span className="symbol-char">{symbol.symbol}</span>
                <span className="symbol-unicode">{getUnicodeDisplay(symbol.symbol)}</span>
                <span className="symbol-category">
                  {Array.isArray(symbol.category) 
                    ? symbol.category.join(', ') 
                    : symbol.category}
                </span>
              </div>
              <div className="symbol-desc">{symbol.name}</div>
            </div>
            <button 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('确定要删除这个符号吗？')) {
                  onDelete(symbol.id);
                }
              }}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymbolList; 