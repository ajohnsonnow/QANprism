/**
 * Bottom Navigation Component
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/map" className="nav-item">
        {({ isActive }) => (
          <>
            <span className="nav-icon" style={{ opacity: isActive ? 1 : 0.5 }}>
              🗺️
            </span>
            {isActive && <div className="nav-indicator" />}
          </>
        )}
      </NavLink>

      <NavLink to="/tribes" className="nav-item">
        {({ isActive }) => (
          <>
            <span className="nav-icon" style={{ opacity: isActive ? 1 : 0.5 }}>
              🏕️
            </span>
            {isActive && <div className="nav-indicator" />}
          </>
        )}
      </NavLink>

      <NavLink to="/aid" className="nav-item">
        {({ isActive }) => (
          <>
            <span className="nav-icon" style={{ opacity: isActive ? 1 : 0.5 }}>
              🤝
            </span>
            {isActive && <div className="nav-indicator" />}
          </>
        )}
      </NavLink>

      <NavLink to="/bridge" className="nav-item">
        {({ isActive }) => (
          <>
            <span className="nav-icon" style={{ opacity: isActive ? 1 : 0.5 }}>
              🌉
            </span>
            {isActive && <div className="nav-indicator" />}
          </>
        )}
      </NavLink>

      <NavLink to="/settings" className="nav-item">
        {({ isActive }) => (
          <>
            <span className="nav-icon" style={{ opacity: isActive ? 1 : 0.5 }}>
              ⚙️
            </span>
            {isActive && <div className="nav-indicator" />}
          </>
        )}
      </NavLink>
    </nav>
  );
};
