import React from 'react';

const SymbolList = ({ symbols, onSelect, currentSymbolId }) => {
  return (
    <div className="symbol-list-section">
      <div className="symbol-list-header">
        <h2>符号列表</h2>
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
              <span className="symbol-category">{symbol.category}</span>
            </div>
            <div className="symbol-desc">{symbol.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymbolList; 