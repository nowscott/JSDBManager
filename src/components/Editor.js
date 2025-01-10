import React, { useState, useEffect } from 'react';

const Editor = ({ symbol, onSave }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    category: [],
    description: '',
    notes: '',
    searchTerms: []
  });

  useEffect(() => {
    if (symbol) {
      setFormData(symbol);
    } else {
      setFormData({
        symbol: '',
        category: [],
        description: '',
        notes: '',
        searchTerms: []
      });
    }
  }, [symbol]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      category: formData.category.filter(cat => cat),
      searchTerms: formData.searchTerms.filter(term => term)
    };
    
    onSave(formattedData);
    
    if (!symbol) {  // 如果是新增，则清空表单
      setFormData({
        symbol: '',
        category: [],
        description: '',
        notes: '',
        searchTerms: []
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'searchTerms' ? value.split(',').map(term => term.trim()) :
              name === 'category' ? value.split(',').map(cat => cat.trim()) :
              value
    }));
  };

  return (
    <div className="editor-section">
      <h2>{symbol ? '编辑符号' : '添加新符号'}</h2>
      <form onSubmit={handleSubmit} className="symbol-form">
        <div className="form-group">
          <label>符号</label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>分类（用逗号分隔多个分类）</label>
          <input
            type="text"
            name="category"
            value={formData.category.join(', ')}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>描述</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>备注</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>搜索关键词（用逗号分隔）</label>
          <input
            type="text"
            name="searchTerms"
            value={formData.searchTerms.join(', ')}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-submit">
          <button type="submit" className="submit-button">
            {symbol ? '更新符号' : '添加符号'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Editor; 