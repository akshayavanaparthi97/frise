import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import '../styles/NotificationCenter.css';

const NotificationCenter = ({ notifications, onMarkRead, onDelete }) => {
  const [filter, setFilter] = useState('all'); // all, unread, expiring, expired

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'expiring') return notif.notification_type === 'expiring_soon';
    if (filter === 'expired') return notif.notification_type === 'expired';
    return true;
  });

  const getNotificationIcon = (type) => {
    if (type === 'expired') {
      return <FiAlertCircle className="icon icon-expired" />;
    }
    return <FiAlertCircle className="icon icon-expiring" />;
  };

  return (
    <div className="notification-center">
      <div className="notif-header">
        <h2>Notifications</h2>
        <div className="notif-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button 
            className={`filter-btn ${filter === 'expiring' ? 'active' : ''}`}
            onClick={() => setFilter('expiring')}
          >
            Expiring Soon
          </button>
          <button 
            className={`filter-btn ${filter === 'expired' ? 'active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FiCheckCircle size={48} />
            <p>No notifications</p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notification-item ${notif.is_read ? 'read' : 'unread'} ${notif.notification_type}`}
            >
              <div className="notif-icon">
                {getNotificationIcon(notif.notification_type)}
              </div>
              
              <div className="notif-content">
                <p className="notif-message">{notif.message}</p>
                <span className="notif-time">
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </div>

              <div className="notif-actions">
                {!notif.is_read && (
                  <button 
                    className="btn-mark-read"
                    onClick={() => onMarkRead(notif.id)}
                    title="Mark as read"
                  >
                    <FiCheckCircle size={18} />
                  </button>
                )}
                <button 
                  className="btn-delete"
                  onClick={() => onDelete(notif.id)}
                  title="Delete"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
