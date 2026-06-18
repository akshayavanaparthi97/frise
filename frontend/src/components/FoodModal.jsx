import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/FoodModal.css';

const emptyFormData = {
  item_name: '',
  category: 'Fruits',
  barcode: '',
  expiry_date: '',
  quantity: 1,
  description: '',
  unit: 'pcs',
  shelf_location: 'Top Shelf',
  space_units: 1
};

const shelfCapacityUnits = {
  'Top Shelf': 8,
  'Middle Shelf': 8,
  'Bottom Shelf': 8,
  'Door Rack': 5,
  'Crisper Drawer': 5,
  Freezer: 4,
  'Chiller Tray': 2,
};

const FoodModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(emptyFormData);
  const [errors, setErrors] = useState({});

  const categories = [
    'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 'Snacks', 
    'Beverages', 'Frozen', 'Pantry', 'Other'
  ];

  const units = ['pcs', 'kg', 'lb', 'liter', 'ml', 'dozen', 'box'];
  const shelfLocations = [
    'Top Shelf',
    'Middle Shelf',
    'Bottom Shelf',
    'Door Rack',
    'Crisper Drawer',
    'Freezer',
    'Chiller Tray'
  ];
  const selectedShelfCapacity = shelfCapacityUnits[formData.shelf_location] || 1;

  useEffect(() => {
    if (!isOpen) return;

    setFormData(initialData ? {
      ...initialData,
      barcode: initialData.barcode || '',
      description: initialData.description || '',
      expiry_date: initialData.expiry_date?.slice(0, 16) || '',
      unit: initialData.unit || 'pcs',
      shelf_location: initialData.shelf_location || 'Top Shelf',
      space_units: initialData.space_units || 1
    } : emptyFormData);
    setErrors({});
  }, [initialData, isOpen]);

  const normalizeBarcode = (value) => value.replace(/\s/g, '').trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'barcode' ? normalizeBarcode(value) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        barcode: normalizeBarcode(prev.barcode)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required';
    }
    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (formData.space_units < 1) {
      newErrors.space_units = 'Space must be at least 1';
    }
    if (formData.barcode && !/^[A-Za-z0-9._-]{4,64}$/.test(formData.barcode)) {
      newErrors.barcode = 'Enter a valid barcode without spaces';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        ...formData,
        barcode: formData.barcode?.trim() || null,
        description: formData.description?.trim() || null,
        shelf_location: formData.shelf_location?.trim() || null,
        quantity: Number(formData.quantity),
        space_units: Number(formData.space_units)
      };

      onSubmit(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData?.id ? 'Edit Food Item' : 'Add New Food Item'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g., Fresh Milk"
              className={errors.item_name ? 'input-error' : ''}
            />
            {errors.item_name && <span className="error-text">{errors.item_name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Barcode</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Enter barcode manually"
                inputMode="numeric"
                autoComplete="off"
                className={errors.barcode ? 'input-error' : ''}
              />
              {errors.barcode && <span className="error-text">{errors.barcode}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Shelf Location</label>
              <select
                name="shelf_location"
                value={formData.shelf_location}
                onChange={handleChange}
              >
                {shelfLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <span className="helper-text">
                Capacity: {selectedShelfCapacity} unit{selectedShelfCapacity !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="form-group">
              <label>Fridge Space Used *</label>
              <input
                type="number"
                name="space_units"
                value={formData.space_units}
                onChange={handleChange}
                min="1"
                max={selectedShelfCapacity}
                className={errors.space_units ? 'input-error' : ''}
              />
              {errors.space_units && <span className="error-text">{errors.space_units}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date *</label>
              <input
                type="datetime-local"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className={errors.expiry_date ? 'input-error' : ''}
              />
              {errors.expiry_date && <span className="error-text">{errors.expiry_date}</span>}
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <div className="quantity-input">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  className={errors.quantity ? 'input-error' : ''}
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about this item..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialData?.id ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodModal;
