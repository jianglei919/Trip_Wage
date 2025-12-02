import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          {t('navbar.tripWage')}
        </Link>

        {/* 汉堡包菜单按钮 */}
        <button 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {isAuthenticated ? (
          <ul className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            <li><Link to="/tripwage" onClick={closeMobileMenu}>{t('navbar.tripWage')}</Link></li>
            <li><Link to="/history" onClick={closeMobileMenu}>{t('navbar.history')}</Link></li>
            <li><Link to="/profile" onClick={closeMobileMenu}>{t('navbar.profile')}</Link></li>
            <li>
              <button onClick={() => { toggleLanguage(); closeMobileMenu(); }} className="lang-switch-btn">
                {i18n.language === 'zh' ? '🌐 EN' : '🌐 中文'}
              </button>
            </li>
            <li className="navbar-user">
              <span className="user-welcome">Welcome, {user?.username}</span>
              <button onClick={handleLogout} className="navbar-logout-btn">
                {t('navbar.logout')}
              </button>
            </li>
          </ul>
        ) : (
          <ul className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            <li><Link to="/login" onClick={closeMobileMenu}>{t('navbar.login')}</Link></li>
            <li><Link to="/register" onClick={closeMobileMenu}>{t('navbar.register')}</Link></li>
            <li>
              <button onClick={() => { toggleLanguage(); closeMobileMenu(); }} className="lang-switch-btn">
                {i18n.language === 'zh' ? '🌐 EN' : '🌐 中文'}
              </button>
            </li>
          </ul>
        )}

        {/* 移动端遮罩层 */}
        {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;
