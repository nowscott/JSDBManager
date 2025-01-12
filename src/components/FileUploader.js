import React from 'react';

const FileUploader = ({ onUpload, onAddPinyin, onRegenerateIds, onSort, onExportJson, onOpenRangeManager, data }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="file-operations">
      <div className="operation-box">
        <h3>数据操作</h3>
        <div className="data-buttons">
          <input 
            type="file" 
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="operation-button upload-button">
            导入 JSON
          </label>
          <button 
            onClick={onExportJson} 
            className="operation-button json-button"
            disabled={!data?.symbols?.length}
          >
            导出 JSON
          </button>
          <button 
            onClick={onOpenRangeManager}
            className="operation-button range-button"
          >
            管理不支持区间
          </button>
        </div>
      </div>

      <div className="operation-box">
        <h3>添加拼音</h3>
        <button 
          onClick={onAddPinyin}
          className="operation-button pinyin-button"
          disabled={!data?.symbols?.length}
        >
          添加拼音
        </button>
      </div>

      <div className="operation-box">
        <h3>整理 ID</h3>
        <button 
          onClick={onRegenerateIds} 
          className="operation-button regenerate-button"
          disabled={!data?.symbols?.length}
        >
          生成新 ID
        </button>
      </div>

      <div className="operation-box">
        <h3>排序功能</h3>
        <div className="sort-buttons">
          <button 
            onClick={() => onSort('notes')} 
            className="operation-button sort-button"
            disabled={!data?.symbols?.length}
          >
            按备注长度排序
          </button>
          <button 
            onClick={() => onSort('category')} 
            className="operation-button sort-button"
            disabled={!data?.symbols?.length}
          >
            按类别排序
          </button>
          <button 
            onClick={() => onSort('unicode')} 
            className="operation-button sort-button"
            disabled={!data?.symbols?.length}
          >
            按 Unicode 排序
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader; 