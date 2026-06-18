import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBox, FiBell, FiBarChart2 } from 'react-icons/fi';
import '../styles/Navbar.css';

const Navbar = ({ unreadCount }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍎</span>
          <span className="brand-name">Frise</span>
        </Link>

        <div className="nav-menu">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/')}`}
          >
            <FiHome size={20} />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/inventory" 
            className={`nav-link ${isActive('/inventory')}`}
          >
            <FiBox size={20} />
            <span>Inventory</span>
          </Link>

          <Link 
            to="/notifications" 
            className={`nav-link ${isActive('/notifications')}`}
          >
            <FiBell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </Link>

          <Link 
            to="/analytics" 
            className={`nav-link ${isActive('/analytics')}`}
          >
            <FiBarChart2 size={20} />
            <span>Analytics</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
