import React from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';
import '../styles/FilterBar.css';

const FilterBar = ({ 
  onSearch, 
  onCategoryFilter, 
  onStatusFilter, 
  onSortChange,
  categories 
}) => {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <FiSearch size={20} />
        <input
          type="text"
          placeholder="Search by name or barcode..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>
            <FiFilter size={16} />
            Category
          </label>
          <select onChange={(e) => onCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select onChange={(e) => onStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="fresh">Fresh</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select onChange={(e) => onSortChange(e.target.value)}>
            <option value="expiry_date">Expiry Date</option>
            <option value="name">Item Name</option>
            <option value="category">Category</option>
            <option value="created_at">Recently Added</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
