import React, { useState, useEffect } from 'react';
import { tripService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalFare: 0,
    avgFare: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await tripService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Trips</h3>
          <p>{stats.totalTrips || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Distance</h3>
          <p>{(stats.totalDistance || 0).toFixed(2)} km</p>
        </div>
        <div className="stat-card">
          <h3>Total Earnings</h3>
          <p>${(stats.totalFare || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Average Fare</h3>
          <p>${(stats.avgFare || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
