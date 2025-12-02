import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          {t('navbar.tripWage')}
        </Link>
        {isAuthenticated ? (
          <ul className="navbar-links">
            <li><Link to="/tripwage">{t('navbar.tripWage')}</Link></li>
            <li><Link to="/history">{t('navbar.history')}</Link></li>
            <li>
              <button onClick={toggleLanguage} className="lang-switch-btn">
                {i18n.language === 'zh' ? '🌐 EN' : '🌐 中文'}
              </button>
            </li>
            <li className="navbar-user">
              <span>Welcome, {user?.username}</span>
              <button onClick={logout} className="navbar-logout-btn">
                {t('navbar.logout')}
              </button>
            </li>
          </ul>
        ) : (
          <ul className="navbar-links">
            <li><Link to="/login">{t('navbar.login')}</Link></li>
            <li><Link to="/register">{t('navbar.register')}</Link></li>
            <li>
              <button onClick={toggleLanguage} className="lang-switch-btn">
                {i18n.language === 'zh' ? '🌐 EN' : '🌐 中文'}
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
