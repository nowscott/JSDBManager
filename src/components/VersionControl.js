import React from 'react';

const VersionControl = ({ version, onUpdate }) => {
  return (
    <div className="version-control">
      <div className="version-info">
        <span className="version-label">版本：</span>
        <span className="version-number">{version}</span>
      </div>
      <div className="version-buttons">
        <button 
          onClick={() => onUpdate('major')}
          className="version-button major"
        >
          主版本 +1
        </button>
        <button 
          onClick={() => onUpdate('minor')}
          className="version-button minor"
        >
          次版本 +1
        </button>
        <button 
          onClick={() => onUpdate('patch')}
          className="version-button patch"
        >
          补丁版本 +1
        </button>
      </div>
    </div>
  );
};

export default VersionControl; 