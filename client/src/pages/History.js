import React, { useState } from 'react';
import { orderService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import './History.css';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const History = () => {
  // 获取本地日期（避免 UTC 时区问题）
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDateString();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  // 快捷日期选择
  const setQuickDate = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setEndDate(formatDate(end));
    setStartDate(formatDate(start));
  };

  // 加载历史数据
  const loadHistory = async () => {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await orderService.getHistoricalStats(startDate, endDate);
      setStats(response.data);
    } catch (error) {
      console.error('加载历史数据失败:', error);
      alert('Failed to load data, please try again');
    }
    setLoading(false);
  };

  // 计算汇总统计
  const summary = stats.reduce((acc, day) => ({
    totalDays: acc.totalDays + (day.actualTrips > 0 ? 1 : 0),
    totalTrips: acc.totalTrips + day.actualTrips,
    totalEffectiveTrips: acc.totalEffectiveTrips + day.effectiveTrips,
    totalLongTrips: acc.totalLongTrips + (day.longTripsCount || 0),
    totalDistance: acc.totalDistance + day.totalDistance,
    totalTips: acc.totalTips + day.totalTips,
    totalFuel: acc.totalFuel + day.fuelFeeTotal,
    totalWorkHours: acc.totalWorkHours + day.workHours,
    totalBasePayment: acc.totalBasePayment + day.basePayment
  }), {
    totalDays: 0,
    totalTrips: 0,
    totalEffectiveTrips: 0,
    totalLongTrips: 0,
    totalDistance: 0,
    totalTips: 0,
    totalFuel: 0,
    totalWorkHours: 0,
    totalBasePayment: 0
  });

  // 正确计算 Total Wage: totalTips + totalFuel + totalWorkHours * 8.5 + longTrips * 3.5
  summary.totalWage = summary.totalTips + summary.totalFuel + (summary.totalWorkHours * 8.5) + (summary.totalLongTrips * 3.5);

  // 准备图表数据
  const chartData = {
    labels: stats.map(s => s.date.substring(5)), // MM-DD
    datasets: [
      {
        label: 'Total Wage',
        data: stats.map(s => s.totalWage.toFixed(2)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y'
      },
      {
        label: 'Tips',
        data: stats.map(s => s.totalTips.toFixed(2)),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.5)',
        yAxisID: 'y'
      },
      {
        label: 'Orders',
        data: stats.map(s => s.actualTrips),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Income Trend Analysis'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Orders'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  // 柱状图 - 每日工资明细
  const barChartData = {
    labels: stats.map(s => s.date.substring(5)),
    datasets: [
      {
        label: 'Base Pay',
        data: stats.map(s => s.basePayment.toFixed(2)),
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      },
      {
        label: 'Tips',
        data: stats.map(s => s.totalTips.toFixed(2)),
        backgroundColor: 'rgba(255, 205, 86, 0.8)'
      },
      {
        label: 'Fuel Cost',
        data: stats.map(s => (-s.fuelFeeTotal).toFixed(2)),
        backgroundColor: 'rgba(255, 99, 132, 0.8)'
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Daily Wage Breakdown'
      }
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      }
    }
  };

  // 饼图 - 收入构成
  const pieChartData = {
    labels: ['Base Pay', 'Tips', 'Fuel Cost (Expense)'],
    datasets: [
      {
        data: [
          summary.totalBasePayment.toFixed(2),
          summary.totalTips.toFixed(2),
          summary.totalFuel.toFixed(2)
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Total Income Composition'
      }
    }
  };

  // 导出 Excel
  const exportToExcel = () => {
    if (stats.length === 0) {
      alert('No data to export');
      return;
    }

    const wsData = [
      ['Date', 'Actual Orders', 'Long Trips', 'Effective Orders', 'Total Distance', 'Tips', 'Fuel Cost', 'Work Hours', 'Base Pay', 'Total Wage', 'Hourly Rate'],
      ...stats.map(s => [
        s.date,
        s.actualTrips,
        s.longTripsCount || 0,
        s.effectiveTrips,
        s.totalDistance.toFixed(1),
        s.totalTips.toFixed(2),
        s.fuelFeeTotal.toFixed(2),
        s.workHours.toFixed(2),
        s.basePayment.toFixed(2),
        s.totalWage.toFixed(2),
        s.hourlyWage.toFixed(2)
      ]),
      [],
      ['Summary Statistics'],
      ['Working Days', summary.totalDays],
      ['Total Orders', summary.totalTrips],
      ['Total Long Trips', summary.totalLongTrips],
      ['Total Effective Orders', summary.totalEffectiveTrips],
      ['Total Distance', summary.totalDistance.toFixed(1)],
      ['Total Tips', summary.totalTips.toFixed(2)],
      ['Total Fuel Cost', summary.totalFuel.toFixed(2)],
      ['Total Work Hours', summary.totalWorkHours.toFixed(2)],
      ['Total Base Pay', summary.totalBasePayment.toFixed(2)],
      ['Total Wage', summary.totalWage.toFixed(2)],
      ['Average Hourly Rate', summary.totalWorkHours > 0 ? (summary.totalWage / summary.totalWorkHours).toFixed(2) : '0.00']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historical Stats');
    XLSX.writeFile(wb, `TripWage_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>📊 Historical Data Analysis</h1>
        
        <div className="date-range-selector">
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <button onClick={loadHistory} disabled={loading}>
              {loading ? 'Loading...' : 'Query'}
            </button>
          </div>
          
          <div className="quick-dates">
            <button onClick={() => setQuickDate(7)}>Last 7 Days</button>
            <button onClick={() => setQuickDate(14)}>Last 14 Days</button>
            <button onClick={() => setQuickDate(30)}>Last 30 Days</button>
            <button onClick={() => setQuickDate(90)}>Last 90 Days</button>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="view-controls">
            <button 
              className={viewMode === 'chart' ? 'active' : ''}
              onClick={() => setViewMode('chart')}
            >
              📈 Chart View
            </button>
            <button 
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              📋 Table View
            </button>
            <button onClick={exportToExcel}>📥 Export Excel</button>
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-label">Working Days</div>
              <div className="card-value">{summary.totalDays} days</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Total Orders</div>
              <div className="card-value">
                {summary.totalTrips}{summary.totalLongTrips > 0 ? `+${summary.totalLongTrips}` : ''} orders
              </div>
            </div>
            <div className="summary-card">
              <div className="card-label">Total Work Hours</div>
              <div className="card-value">{summary.totalWorkHours.toFixed(1)} hours</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Total Distance</div>
              <div className="card-value">{summary.totalDistance.toFixed(1)} km</div>
            </div>
            <div className="summary-card highlight">
              <div className="card-label">Total Wage</div>
              <div className="card-value">¥{summary.totalWage.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Avg Hourly Rate</div>
              <div className="card-value">
                ¥{summary.totalWorkHours > 0 ? (summary.totalWage / summary.totalWorkHours).toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="summary-card">
              <div className="card-label">Total Tips</div>
              <div className="card-value tips">${summary.totalTips.toFixed(2)}</div>
            </div>
            <div className="summary-card fuel">
              <div className="card-label">Total Fuel Cost</div>
              <div className="card-value fuel">${summary.totalFuel.toFixed(2)}</div>
            </div>
          </div>

          {viewMode === 'chart' ? (
            <div className="charts-grid">
              <div className="chart-box">
                <div style={{ height: '350px' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
              <div className="chart-box">
                <div style={{ height: '350px' }}>
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
              <div className="chart-box pie-chart">
                <div style={{ height: '350px' }}>
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
            </div>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Actual Orders</th>
                    <th>Long Trips</th>
                    <th>Effective Orders</th>
                    <th>Total Distance</th>
                    <th>Tips</th>
                    <th>Fuel Cost</th>
                    <th>Work Hours</th>
                    <th>Base Pay</th>
                    <th>Total Wage</th>
                    <th>Hourly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((day) => (
                    <tr key={day.date} className={day.actualTrips === 0 ? 'no-work-day' : ''}>
                      <td>{day.date}</td>
                      <td>{day.actualTrips}{day.longTripsCount > 0 ? `+${day.longTripsCount}` : ''}</td>
                      <td>{day.longTripsCount || 0}</td>
                      <td>{day.effectiveTrips}</td>
                      <td>{day.totalDistance.toFixed(1)}</td>
                      <td className="tips-cell">${day.totalTips.toFixed(2)}</td>
                      <td className="fuel-cell">${day.fuelFeeTotal.toFixed(2)}</td>
                      <td>{day.workHours.toFixed(1)}</td>
                      <td>${day.basePayment.toFixed(2)}</td>
                      <td className="wage-cell">¥{day.totalWage.toFixed(2)}</td>
                      <td>¥{day.hourlyWage.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && stats.length === 0 && (
        <div className="empty-state">
          <p>📅 Please select a date range to query historical data</p>
        </div>
      )}
    </div>
  );
};

export default History;
