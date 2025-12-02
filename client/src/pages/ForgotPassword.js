import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderService } from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      await orderService.forgotPassword({ email });
      setMessage({ type: 'success', text: t('forgotPassword.emailSent') });
      setEmail('');
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg === 'User not found') {
        setMessage({ type: 'error', text: t('forgotPassword.emailNotFound') });
      } else {
        setMessage({ type: 'error', text: errorMsg || t('forgotPassword.sendFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>🔑 {t('forgotPassword.title')}</h2>
        
        <p className="auth-description">
          {t('forgotPassword.description')}
        </p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('forgotPassword.email')}</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '...' : t('forgotPassword.sendButton')}
          </button>
        </form>

        <div className="auth-link">
          <Link to="/login">← {t('forgotPassword.backToLogin')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
