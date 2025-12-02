import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderService } from '../services/api';
import './Auth.css';

const ChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // 验证新密码
    if (formData.newPassword !== formData.confirmNewPassword) {
      setMessage({ type: 'error', text: t('changePassword.passwordMismatch') });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: t('changePassword.passwordTooShort') });
      return;
    }

    setLoading(true);

    try {
      await orderService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setMessage({ type: 'success', text: t('changePassword.changeSuccess') });
      
      // 2秒后跳转回个人中心
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg === 'Current password is incorrect') {
        setMessage({ type: 'error', text: t('changePassword.wrongPassword') });
      } else {
        setMessage({ type: 'error', text: errorMsg || t('changePassword.changeFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>🔒 {t('changePassword.title')}</h2>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('changePassword.currentPassword')}</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label>{t('changePassword.newPassword')}</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="6"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>{t('changePassword.confirmNewPassword')}</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              required
              minLength="6"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '...' : t('changePassword.changeButton')}
          </button>
        </form>

        <div className="auth-link">
          <button 
            onClick={() => navigate('/profile')} 
            className="link-button"
          >
            ← {t('changePassword.backToProfile')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
