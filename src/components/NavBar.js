import React, { useState, useRef, useEffect } from 'react';
import { getCacheInfo, clearCache } from '../utils/cacheManager';

const NavBar = ({ 
  onUpload, 
  onExportJson, 
  onOpenRangeManager, 
  onResetSearchTerms,
  onSort,
  onExportPinyinMap,
  data,
  version,
  onUpdateVersion
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // 获取缓存信息
  useEffect(() => {
    const updateCacheInfo = () => {
      setCacheInfo(getCacheInfo());
    };
    
    updateCacheInfo();
    // 每次菜单打开时更新缓存信息
    if (isMenuOpen) {
      updateCacheInfo();
    }
  }, [isMenuOpen]);

  // 清理缓存
  const handleClearCache = () => {
    if (window.confirm('确定要清理本地缓存吗？这将删除所有已保存的数据。')) {
      clearCache();
      setCacheInfo(null);
      setIsMenuOpen(false);
      alert('缓存已清理');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

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
                 onExportJson('data');
                 setIsMenuOpen(false);
               }} 
               className="menu-button"
               disabled={!data?.symbols?.length}
             >导出 data.json</button>
             <button 
               onClick={() => {
                 onExportJson('data-beta');
                 setIsMenuOpen(false);
               }} 
               className="menu-button"
               disabled={!data?.symbols?.length}
             >导出 data-beta.json</button>
             <button 
               onClick={() => {
                 onExportJson('emoji');
                 setIsMenuOpen(false);
               }} 
               className="menu-button"
               disabled={!data?.symbols?.length}
             >导出 emoji-data.json</button>
            <button 
              onClick={() => {
                onOpenRangeManager();
                setIsMenuOpen(false);
              }}
              className="menu-button"
            >管理不支持区间</button>
            <button 
              onClick={() => {
                onExportPinyinMap();
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >导出拼音映射</button>
          </div>
        </div>

        <div className="menu-section">
          <h3>数据处理</h3>
          <div className="menu-group">
            <button 
              onClick={() => {
                onResetSearchTerms();
                setIsMenuOpen(false);
              }}
              className="menu-button"
              disabled={!data?.symbols?.length}
            >重置检索词</button>
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

        <div className="menu-section">
          <h3>缓存管理</h3>
          <div className="menu-group">
            {cacheInfo ? (
              <div className="cache-info">
                <div className="cache-detail">符号数量: {cacheInfo.symbolCount}</div>
                <div className="cache-detail">缓存大小: {formatFileSize(cacheInfo.size)}</div>
                <div className="cache-detail">更新时间: {formatTime(cacheInfo.timestamp)}</div>
                <button 
                  onClick={handleClearCache}
                  className="menu-button cache-clear"
                >清理缓存</button>
              </div>
            ) : (
              <div className="cache-info">
                <div className="cache-detail">暂无缓存数据</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;