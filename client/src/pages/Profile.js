import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { orderService } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  // 使用 localStorage 持久化编辑状态，抵抗组件重挂载
  const [isEditing, setIsEditingState] = useState(() => {
    return localStorage.getItem('__profile_editing__') === 'true';
  });
  
  // 包装 setIsEditing，确保同步到 localStorage
  const setIsEditing = (value) => {
    if (value) {
      localStorage.setItem('__profile_editing__', 'true');
    } else {
      localStorage.removeItem('__profile_editing__');
    }
    setIsEditingState(value);
  };
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  // 用于跟踪自动清除消息的定时器
  const messageTimerRef = useRef(null);

  const handleEdit = () => {
    setIsEditing(true);
    setMessage({ type: '', text: '' });
    
    // 清除任何待执行的消息清除定时器
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 只有在编辑模式下才允许提交
    if (!isEditing) {
      return;
    }
    
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await orderService.updateProfile(formData);
      const updatedUser = response.data.user;
      
      // 同步更新 localStorage 和 context，避免组件重挂载
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setMessage({ type: 'success', text: t('profile.updateSuccess') });
      setIsEditing(false);
      
      // 清除旧定时器，设置新的3秒后自动清除成功消息
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = setTimeout(() => {
        setMessage({ type: '', text: '' });
        messageTimerRef.current = null;
      }, 3000);
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
    
    // 清除任何待执行的消息清除定时器
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
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
                  autoFocus={isEditing}
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

              {isEditing && (
                <div className="button-group">
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
                </div>
              )}
            </form>
            
            {!isEditing && (
              <div className="button-group">
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleEdit}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
