import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Trip Wage
        </Link>
        {isAuthenticated ? (
          <ul className="navbar-links">
            <li><Link to="/tripwage">Trip Wage</Link></li>
            <li><Link to="/history">History</Link></li>
            <li className="navbar-user">
              <span>Welcome, {user?.username}</span>
              <button onClick={logout} className="navbar-logout-btn">
                Logout
              </button>
            </li>
          </ul>
        ) : (
          <ul className="navbar-links">
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
