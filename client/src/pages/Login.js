import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData);
      navigate('/tripwage');
    } catch (err) {
      setError(err.response?.data?.error || t('login.loginFailed'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{t('login.title')}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('login.password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-submit-btn">
            {t('login.loginButton')}
          </button>
        </form>
        <div className="auth-link">
          {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
