import React, { useState } from 'react';

const SystemRangeManager = ({ isOpen, onClose, systemRanges, onSave }) => {
  const [ranges, setRanges] = useState(systemRanges || {
    ios: [],
    android: [],
    win: [],
    mac: []
  });

  const [newRange, setNewRange] = useState({
    system: 'ios',
    range: ''
  });

  // 验证区间格式
  const isValidRange = (range) => {
    // 支持 4-5 位的 Unicode 区间
    return /^[0-9A-F]{4,5}-[0-9A-F]{4,5}$/i.test(range);
  };

  // 添加新区间
  const handleAddRange = () => {
    if (!isValidRange(newRange.range)) {
      alert('请输入正确的区间格式，例如：0000-007F');
      return;
    }

    setRanges(prev => ({
      ...prev,
      [newRange.system]: [...prev[newRange.system], newRange.range.toUpperCase()]
    }));
    setNewRange({ ...newRange, range: '' });
  };

  // 删除区间
  const handleDeleteRange = (system, rangeToDelete) => {
    setRanges(prev => ({
      ...prev,
      [system]: prev[system].filter(range => range !== rangeToDelete)
    }));
  };

  // 保存更改
  const handleSave = () => {
    onSave(ranges);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>不支持区间管理</h2>
        
        <div className="range-input">
          <select 
            value={newRange.system}
            onChange={(e) => setNewRange({ ...newRange, system: e.target.value })}
            className="range-select"
          >
            <option value="ios">iOS</option>
            <option value="android">Android</option>
            <option value="win">Windows</option>
            <option value="mac">macOS</option>
          </select>
          <input
            type="text"
            placeholder="输入区间 (例如: 0000-007F)"
            value={newRange.range}
            onChange={(e) => setNewRange({ ...newRange, range: e.target.value.toUpperCase() })}
            className="range-text-input"
          />
          <button 
            onClick={handleAddRange}
            className="add-range-button"
          >
            添加区间
          </button>
        </div>

        <div className="ranges-container">
          {Object.entries(ranges).map(([system, systemRanges]) => (
            <div key={system} className="system-ranges">
              <h3>{system.toUpperCase()}</h3>
              <div className="range-list">
                {systemRanges.map((range, index) => (
                  <div key={index} className="range-item">
                    <span>{range}</span>
                    <button 
                      onClick={() => handleDeleteRange(system, range)}
                      className="delete-range"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button onClick={handleSave}>保存</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default SystemRangeManager; 