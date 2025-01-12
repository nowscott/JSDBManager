import React from 'react';

const SearchBar = ({ onSearch }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="搜索符号、名称、分类或 Unicode (U+xxxx)"
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar; 