import React, { useState, useEffect } from 'react';
import FoodCard from './FoodCard';
import FilterBar from './FilterBar';
import '../styles/Inventory.css';

const Inventory = ({
  items,
  categories,
  onEdit,
  onDelete,
  onMarkConsumed,
  onMarkWasted,
  onImageUpload
}) => {
  const [filteredItems, setFilteredItems] = useState(items);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('expiry_date');

  useEffect(() => {
    let result = [...items];

    // Apply search
    if (searchTerm) {
      result = result.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchTerm))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus) {
      result = result.filter(item => item.status === selectedStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'expiry_date':
          return new Date(a.expiry_date) - new Date(b.expiry_date);
        case 'name':
          return a.item_name.localeCompare(b.item_name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });

    setFilteredItems(result);
  }, [items, searchTerm, selectedCategory, selectedStatus, sortBy]);

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Food Inventory</h1>
        <p>Manage your food items and track expiry dates</p>
      </div>

      <FilterBar
        onSearch={setSearchTerm}
        onCategoryFilter={setSelectedCategory}
        onStatusFilter={setSelectedStatus}
        onSortChange={setSortBy}
        categories={categories}
      />

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No items found</h2>
          <p>Try adjusting your filters or add a new food item to get started</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map(item => (
            <FoodCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onMarkConsumed={onMarkConsumed}
              onMarkWasted={onMarkWasted}
              onImageUpload={onImageUpload}
            />
          ))}
        </div>
      )}

      <div className="inventory-footer">
        <p>Showing {filteredItems.length} of {items.length} items</p>
      </div>
    </div>
  );
};

export default Inventory;
