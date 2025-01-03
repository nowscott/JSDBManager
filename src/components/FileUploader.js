import React from 'react';

const FileUploader = ({ onUpload, onDownload, onAddPinyin }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="file-operations">
      <div className="operation-box">
        <h3>上传文件</h3>
        <input 
          type="file" 
          accept=".js" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" className="operation-button upload-button">
          选择文件
        </label>
      </div>

      <div className="operation-box">
        <h3>添加拼音</h3>
        <button 
          onClick={onAddPinyin}
          className="operation-button pinyin-button"
        >
          添加拼音
        </button>
      </div>
      
      <div className="operation-box">
        <h3>下载文件</h3>
        <button 
          onClick={onDownload} 
          className="operation-button download-button"
        >
          下载文件
        </button>
      </div>
    </div>
  );
};

export default FileUploader; 