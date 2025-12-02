import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { orderService } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
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
    setLoading(true);

    try {
      const response = await orderService.updateProfile(formData);
      setUser(response.data.user);
      setMessage({ type: 'success', text: t('profile.updateSuccess') });
      setIsEditing(false);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || t('profile.updateFailed') 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>👤 {t('profile.title')}</h1>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-section">
            <h2>{t('profile.accountInfo')}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('profile.username')}</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('profile.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="button-group">
                {!isEditing ? (
                  <>
                    <button 
                      type="button" 
                      className="btn-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️ {t('profile.editProfile')}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => navigate('/change-password')}
                    >
                      🔒 {t('profile.changePassword')}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? '...' : `💾 ${t('profile.saveChanges')}`}
                    </button>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      ❌ {t('profile.cancel')}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
