import React from 'react';

const FloatingWindow = ({ content, onInsert, onClose }) => {
  // 将内容按段落分割并渲染
  const paragraphs = content.split('\n').filter(p => p.trim());

  return (
    <div className="floating-window-overlay">
      <div className="floating-window">
        <div className="floating-window-content">
          <h3>生成的备注内容</h3>
          <div className="content-paragraphs">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <div className="floating-window-buttons">
            <button onClick={onInsert} className="insert-button">插入内容</button>
            <button onClick={onClose} className="close-button">关闭</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingWindow;