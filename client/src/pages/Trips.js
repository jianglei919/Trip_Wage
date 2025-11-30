import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripService } from '../services/api';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await tripService.getTrips();
      setTrips(response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripService.deleteTrip(id);
        setTrips(trips.filter(trip => trip._id !== id));
      } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>My Trips</h1>
        <Link to="/add-trip" className="btn btn-primary">
          Add New Trip
        </Link>
      </div>
      
      {trips.length === 0 ? (
        <div className="card">
          <p>No trips found. Start by adding your first trip!</p>
        </div>
      ) : (
        <div className="trip-list">
          {trips.map(trip => (
            <div key={trip._id} className="trip-card">
              <div className="trip-info">
                <h3>{trip.origin} → {trip.destination}</h3>
                <div className="trip-details">
                  <span>📅 {formatDate(trip.date)}</span>
                  <span>📏 {trip.distance} km</span>
                  <span>⏱️ {trip.duration} min</span>
                  <span>💰 ${trip.fare.toFixed(2)}</span>
                  <span>Status: {trip.status}</span>
                </div>
                {trip.notes && <p style={{ marginTop: '0.5rem', color: '#666' }}>{trip.notes}</p>}
              </div>
              <div className="trip-actions">
                <button 
                  onClick={() => handleDelete(trip._id)} 
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trips;
