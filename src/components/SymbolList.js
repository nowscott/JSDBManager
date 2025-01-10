import React from 'react';
import SearchBar from './SearchBar';

const SymbolList = ({ symbols, onSelect, currentSymbolId, onSearch }) => {
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
            onClick={() => onSelect(symbol)}
          >
            <div className="symbol-main">
              <span className="symbol-char">{symbol.symbol}</span>
              <span className="symbol-category">
                {Array.isArray(symbol.category) 
                  ? symbol.category.join(', ') 
                  : symbol.category}
              </span>
            </div>
            <div className="symbol-desc">{symbol.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymbolList; 