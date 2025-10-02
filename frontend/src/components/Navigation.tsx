import React from 'react';
import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link ${isActive ? 'active' : ''}`;

const Navigation: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>📷 Image Database</h2>
      </div>
      <ul className="nav-menu">
        <li className="nav-item">
          <NavLink to="/" end className={linkClass}>
            🏠 Home
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/upload" className={linkClass}>
            ⬆️ Upload
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/tags" className={linkClass}>
            🏷️ Tags
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/gallery" className={linkClass}>
            🖼️ Gallery
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/settings" className={linkClass}>
            ⚙️ Settings
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;