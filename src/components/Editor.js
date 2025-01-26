import React, { useState, useEffect } from 'react';
import { generateSymbolNotes } from '../utils/symbolGen';
import FloatingWindow from './FloatingWindow';

const Editor = ({ symbol, onSave }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    category: [],
    name: '',
    notes: '',
    searchTerms: [],
    pronunciation: ''
  });

  useEffect(() => {
    if (symbol) {
      const { description, ...rest } = symbol;
      setFormData(rest);
    } else {
      setFormData({
        symbol: '',
        category: [],
        name: '',
        notes: '',
        searchTerms: [],
        pronunciation: ''
      });
    }
  }, [symbol]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formattedData = {
      ...formData,
      name: formData.name.replace(/\s+/g, ''),  // 只对名称移除所有空格
      category: formData.category.filter(cat => cat),  // 保持原有的空值过滤
      searchTerms: formData.searchTerms.filter(term => term)  // 保持原有的空值过滤
    };
    
    onSave(formattedData);
    
    if (!symbol) {  // 如果是新增，则清空表单
      setFormData({
        symbol: '',
        category: [],
        name: '',
        notes: '',
        searchTerms: [],
        pronunciation: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'searchTerms' || name === 'category' 
        ? value.split(/[,，]/).map(item => item.trim()).filter(item => item)
        : name === 'name'
          ? value.replace(/\s+/g, '')  // 移除名称中的所有空格（包括中间的空格）
          : value
    }));
  };

  const [generatedNote, setGeneratedNote] = useState('');
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);

  const generateNotes = async () => {
    try {
      const note = await generateSymbolNotes(formData.symbol, formData.name);
      setGeneratedNote(note);
      setShowFloatingWindow(true);
    } catch (error) {
      alert('生成备注失败，请稍后重试');
    }
  };

  const handleInsertNote = () => {
    setFormData(prev => ({
      ...prev,
      notes: generatedNote
    }));
    setShowFloatingWindow(false);
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
            autoComplete="off"
          />
        </div>
        
        <div className="form-group">
          <label>名称</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="off"
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
          <label>读音</label>
          <input
            type="text"
            name="pronunciation"
            value={formData.pronunciation}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        
        <div className="form-group">
          <div className="label-with-button">
            <label>备注</label>
            <button 
              type="button"
              className="generate-notes-button"
              onClick={generateNotes}
            >
              生成
            </button>
          </div>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label>搜索关键词（用逗号分隔）</label>
          <input
            type="text"
            name="searchTerms"
            value={formData.searchTerms.join(', ')}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        
        <div className="form-submit">
          <button type="submit" className="submit-button">
            {symbol ? '更新符号' : '添加符号'}
          </button>
        </div>
      </form>
      
      {showFloatingWindow && (
        <FloatingWindow
          content={generatedNote}
          onInsert={handleInsertNote}
          onClose={() => setShowFloatingWindow(false)}
        />
      )}
      
      {/* ... 其他表单内容 ... */}
    </div>
  );
};

export default Editor;