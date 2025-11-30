import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../services/api';

const AddTrip = () => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    distance: '',
    duration: '',
    fare: '',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: ''
  });
  const [error, setError] = useState('');
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
      await tripService.createTrip({
        ...formData,
        distance: parseFloat(formData.distance),
        duration: parseInt(formData.duration),
        fare: parseFloat(formData.fare)
      });
      navigate('/trips');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trip');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Add New Trip</h1>
      <div className="form-container">
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Origin *</label>
            <input
              type="text"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Destination *</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Distance (km) *</label>
            <input
              type="number"
              step="0.1"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Duration (minutes) *</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Fare ($) *</label>
            <input
              type="number"
              step="0.01"
              name="fare"
              value={formData.fare}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              Add Trip
            </button>
            <button 
              type="button" 
              className="btn" 
              onClick={() => navigate('/trips')}
              style={{ background: '#6c757d', color: 'white' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTrip;
