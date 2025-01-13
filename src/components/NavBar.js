import React, { useState, useEffect, useRef } from 'react';

const NavBar = ({ 
  onUpload, 
  onExportJson, 
  onOpenRangeManager, 
  onAddPinyin, 
  onRegenerateIds, 
  onSort,
  data,
  version,
  onUpdateVersion
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 如果点击的不是菜单内部和菜单按钮，则关闭菜单
      if (menuRef.current && 
          !menuRef.current.contains(event.target) && 
          !buttonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // 添加全局点击事件监听
    document.addEventListener('mousedown', handleClickOutside);

    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(file);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="nav-bar">
      <div className="nav-header">
        <button 
          ref={buttonRef}
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="menu-icon"></span>
          功能菜单
        </button>
        <span className="version-info">
          <span className="version-label">版本：</span>
          <span className="version-number">{version}</span>
          <div className="version-buttons">
            <button onClick={() => onUpdateVersion('major')} className="version-button major">+1</button>
            <button onClick={() => onUpdateVersion('minor')} className="version-button minor">+1</button>
            <button onClick={() => onUpdateVersion('patch')} className="version-button patch">+1</button>
          </div>
        </span>
      </div>

      <div ref={menuRef} className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-section">
          <h3>数据操作</h3>
          <div className="menu-group">
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="menu-button">导入 JSON</label>
            <button 
              onClick={() => {
                onExportJson();
                setIsMenuOpen(false);
              }} 
              className="menu-button"
              disabled={!data?.symbols?.length}
            >导出 JSON</button>
            <button 
              onClick={() => {
                onOpenRangeManager();
                setIsMenuOpen(false);
              }}
              className="menu-button"
            >管理不支持区间</button>
          </div>
        </div>

        <div className="menu-section">
          <h3>数据处理</h3>
          <div className="menu-group">
            <button 
              onClick={() => {
                onAddPinyin();
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >添加拼音</button>
            <button 
              onClick={() => {
                onRegenerateIds();
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >生成新 ID</button>
          </div>
        </div>

        <div className="menu-section">
          <h3>排序功能</h3>
          <div className="menu-group">
            <button 
              onClick={() => {
                onSort('notes');
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >按备注长度排序</button>
            <button 
              onClick={() => {
                onSort('category');
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >按类别排序</button>
            <button 
              onClick={() => {
                onSort('unicode');
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >按 Unicode 排序</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 