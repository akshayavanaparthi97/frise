import React, { useState, useEffect } from 'react';
import { FiCheck, FiEdit, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getMediaUrl } from '../services/api';
import '../styles/FoodCard.css';

const FoodCard = ({ item, onEdit, onDelete, onMarkConsumed, onMarkWasted, onImageUpload }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [imagePreview, setImagePreview] = useState(item.image_path);

  useEffect(() => {
    setImagePreview(item.image_path);
  }, [item.image_path]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const expiry = new Date(item.expiry_date);
      const diff = expiry - now;

      if (diff < 0) {
        setTimeRemaining('Expired');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          setTimeRemaining(`${days} day${days !== 1 ? 's' : ''} left`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours} hour${hours !== 1 ? 's' : ''} left`);
        } else {
          setTimeRemaining('Less than 1 hour left');
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [item.expiry_date]);

  const getStatusColor = () => {
    switch (item.status) {
      case 'fresh':
        return '#4CAF50';
      case 'expiring_soon':
        return '#FF9800';
      case 'expired':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImageUpload(item.id, file);
        setImagePreview(URL.createObjectURL(file));
        toast.success('Image uploaded successfully!');
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }
  };

  return (
    <div className="food-card">
      <div className="card-image-container">
        {imagePreview ? (
          <img src={getMediaUrl(imagePreview)} alt={item.item_name} className="card-image" />
        ) : (
          <div className="card-image-placeholder">
            <span>No Image</span>
          </div>
        )}
        <div className="image-tools">
          <label className="image-upload-label" title="Upload image">
            <FiUpload size={19} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title">{item.item_name}</h3>
        
        <div className="card-info">
          <div className="info-row">
            <span className="info-label">Category:</span>
            <span className="info-value">{item.category}</span>
          </div>

          {item.barcode && (
            <div className="info-row">
              <span className="info-label">Barcode:</span>
              <span className="info-value">{item.barcode}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Expiry:</span>
            <span className="info-value">
              {new Date(item.expiry_date).toLocaleDateString()}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Quantity:</span>
            <span className="info-value">{item.quantity} {item.unit || 'unit'}</span>
          </div>

          {item.shelf_location && (
            <div className="info-row">
              <span className="info-label">Shelf:</span>
              <span className="info-value">{item.shelf_location}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label">Space:</span>
            <span className="info-value">{item.space_units || 1} unit{(item.space_units || 1) !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="card-status">
          <div 
            className="status-badge" 
            style={{ backgroundColor: getStatusColor() }}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </div>
          <div className="time-remaining">
            {timeRemaining}
          </div>
        </div>

        {item.description && (
          <p className="card-description">{item.description}</p>
        )}

        <div className="card-actions">
          <button
            className="btn btn-used"
            onClick={() => onMarkConsumed(item.id)}
            title="Mark used"
          >
            <FiCheck size={18} />
          </button>
          <button
            className="btn btn-wasted"
            onClick={() => onMarkWasted(item.id)}
            title="Mark wasted"
          >
            <FiX size={18} />
          </button>
          <button 
            className="btn btn-edit"
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <FiEdit size={18} />
          </button>
          <button 
            className="btn btn-delete"
            onClick={() => onDelete(item.id)}
            title="Delete"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
