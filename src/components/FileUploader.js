import React from 'react';

const FileUploader = ({ onUpload, onDownload, onAddPinyin, onRegenerateIds, onSort, onExportJson, onLoadFromApi, data }) => {
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
            accept=".js" 
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="operation-button upload-button">
            上传文件
          </label>
          <button 
            onClick={onLoadFromApi}
            className="operation-button api-button"
          >
            从 API 加载
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
        </div>
      </div>

      <div className="operation-box">
        <h3>导出</h3>
        <div className="export-buttons">
          <button 
            onClick={onDownload} 
            className="operation-button download-button"
            disabled={!data?.symbols?.length}
          >
            导出 JS
          </button>
          <button 
            onClick={onExportJson} 
            className="operation-button json-button"
            disabled={!data?.symbols?.length}
          >
            导出 JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader; 