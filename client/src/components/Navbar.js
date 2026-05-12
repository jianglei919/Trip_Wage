import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const hideBottomBar = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            {t('navbar.tripWage')}
          </Link>

          {/* 桌面端完整菜单 */}
          {isAuthenticated ? (
            <ul className="navbar-links">
              <li><NavLink to="/dashboard">{t('navbar.dashboard')}</NavLink></li>
              <li><NavLink to="/stats">{t('navbar.stats')}</NavLink></li>
              <li><NavLink to="/profile">{t('navbar.profile')}</NavLink></li>
              <li>
                <button onClick={toggleLanguage} className="lang-switch-btn">
                  {i18n.language === 'zh' ? '🌐 EN' : '🌐 中文'}
                </button>
              </li>
              <li className="navbar-user">
                <span className="user-welcome">Welcome, {user?.username}</span>
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

          {/* 移动端：顶栏右侧的快捷按钮 */}
          <div className="navbar-mobile-actions">
            <button
              onClick={toggleLanguage}
              className="navbar-icon-btn"
              aria-label="Switch language"
            >
              {i18n.language === 'zh' ? 'EN' : '中'}
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端底部 tab bar */}
      {isAuthenticated && !hideBottomBar && (
        <nav className="bottom-tab-bar">
          <NavLink to="/dashboard" className="bottom-tab">
            <span className="bottom-tab-icon">🏠</span>
            <span className="bottom-tab-label">{t('navbar.dashboard')}</span>
          </NavLink>
          <NavLink to="/stats" className="bottom-tab">
            <span className="bottom-tab-icon">📊</span>
            <span className="bottom-tab-label">{t('navbar.stats')}</span>
          </NavLink>
          <NavLink to="/profile" className="bottom-tab">
            <span className="bottom-tab-icon">👤</span>
            <span className="bottom-tab-label">{t('navbar.profile')}</span>
          </NavLink>
        </nav>
      )}
    </>
  );
};

export default Navbar;
