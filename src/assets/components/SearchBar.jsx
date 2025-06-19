import React from "react";
import "./MemberTable.css";

const SearchBar = ({ onSearch }) => {
  return (
    <input
      type="text"
      className="search-bar"
      placeholder="Search by name or member ID..."
      onChange={(e) => onSearch(e.target.value)}
    />
  );
};

export default SearchBar;
