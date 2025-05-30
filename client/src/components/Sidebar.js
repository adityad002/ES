import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaBook,
  FaCog,
  FaBars
} from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Only render sidebar if user is authenticated
  if (!user) return null;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
      </div>
      <div className="sidebar-menu">
        <ul>
          <li className={location.pathname === '/dashboard' ? 'active' : ''}>
            <Link to="/dashboard">
              <FaTachometerAlt className="icon" />
              <span className="text">Dashboard</span>
            </Link>
          </li>
          <li className={location.pathname === '/timetable' ? 'active' : ''}>
            <Link to="/timetable">
              <FaCalendarAlt className="icon" />
              <span className="text">Timetable</span>
            </Link>
          </li>
          <li className={location.pathname === '/teachers' ? 'active' : ''}>
            <Link to="/teachers">
              <FaChalkboardTeacher className="icon" />
              <span className="text">Teachers</span>
            </Link>
          </li>
          <li className={location.pathname === '/subjects' ? 'active' : ''}>
            <Link to="/subjects">
              <FaBook className="icon" />
              <span className="text">Subjects</span>
            </Link>
          </li>
          {user && user.role === 'admin' && (
            <li className={location.pathname === '/settings' ? 'active' : ''}>
              <Link to="/settings">
                <FaCog className="icon" />
                <span className="text">Settings</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
      <div className="sidebar-footer">
        <span className="version">v3.0.0</span>
      </div>
    </div>
  );
};

export default Sidebar; 