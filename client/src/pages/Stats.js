import React, { useState } from 'react';
import { orderService } from '../services/api';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import wageConfig from '../config/wage.config';
import './Stats.css';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Stats = () => {
  const { t } = useTranslation();
  
  // 获取本地日期（避免 UTC 时区问题）
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDateString();

  // 计算包含今天的双周周期 (基于 wage.config 的锚点日期)
  const getCurrentBiweeklyCycle = () => {
    const parseLocal = (str) => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const cycleDays = wageConfig.biweeklySettlementDays;
    const anchor = parseLocal(wageConfig.biweeklyAnchorDate);
    const now = parseLocal(today);
    const diffDays = Math.floor((now - anchor) / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(diffDays / cycleDays);
    const start = new Date(anchor);
    start.setDate(anchor.getDate() + cycleIndex * cycleDays);
    const end = new Date(start);
    end.setDate(start.getDate() + cycleDays - 1);
    return { start: format(start), end: format(end) };
  };

  const defaultCycle = getCurrentBiweeklyCycle();
  const [startDate, setStartDate] = useState(defaultCycle.start);
  const [endDate, setEndDate] = useState(defaultCycle.end);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  // 切换周期 (offsetCycles: -1 上一周期 / +1 下一周期 / 0 当前周期)
  const shiftCycle = (offsetCycles) => {
    const parseLocal = (str) => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const cycleDays = wageConfig.biweeklySettlementDays;
    let newStart;
    if (offsetCycles === 0) {
      newStart = parseLocal(getCurrentBiweeklyCycle().start);
    } else {
      newStart = parseLocal(startDate);
      newStart.setDate(newStart.getDate() + offsetCycles * cycleDays);
    }
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + cycleDays - 1);
    const sStr = format(newStart);
    const eStr = format(newEnd);
    setStartDate(sStr);
    setEndDate(eStr);
    loadStats(sStr, eStr);
  };

  // 加载历史数据 (可选传入 start/end 覆盖当前 state)
  const loadStats = async (sOverride, eOverride) => {
    const s = sOverride || startDate;
    const e = eOverride || endDate;
    if (!s || !e) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await orderService.getHistoricalStats(s, e);
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

  // 正确计算 Total Wage: totalTips + totalFuel + totalBasePayment
  summary.totalWage = summary.totalTips + summary.totalFuel + summary.totalBasePayment;
  
  // 计算 Base + Fuel
  summary.basePlusFuel = summary.totalBasePayment + summary.totalFuel;

  // 柱状图 - 每日工资明细
  const barChartData = {
    labels: stats.map(s => s.date.substring(5)),
    datasets: [
      {
        label: t('stats.charts.basePay'),
        data: stats.map(s => s.basePayment.toFixed(2)),
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      },
      {
        label: t('stats.charts.tips'),
        data: stats.map(s => s.totalTips.toFixed(2)),
        backgroundColor: 'rgba(255, 205, 86, 0.8)'
      },
      {
        label: t('stats.charts.fuelSubsidy'),
        data: stats.map(s => Math.abs(s.fuelFeeTotal).toFixed(2)),
        backgroundColor: 'rgba(76, 175, 80, 0.8)'
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
        text: t('stats.charts.dailyWageBreakdown')
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

  // 饼图 - 收入构成（label 带百分比）
  const pieValues = [
    summary.totalBasePayment,
    summary.totalTips,
    Math.abs(summary.totalFuel)
  ];
  const pieTotal = pieValues.reduce((s, v) => s + v, 0);
  const pieLabel = (text, value) => {
    const pct = pieTotal > 0 ? ((value / pieTotal) * 100).toFixed(1) : '0.0';
    return `${text} ${pct}%`;
  };
  const pieChartData = {
    labels: [
      pieLabel(t('stats.charts.basePay'), pieValues[0]),
      pieLabel(t('stats.charts.tips'), pieValues[1]),
      pieLabel(t('stats.charts.fuelSubsidy'), pieValues[2])
    ],
    datasets: [
      {
        data: pieValues.map(v => v.toFixed(2)),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(76, 175, 80, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(76, 175, 80, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 8, bottom: 8 }
    },
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 14,
          padding: 10
        }
      },
      title: {
        display: true,
        text: t('stats.charts.totalIncomeComposition')
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = Number(ctx.raw) || 0;
            const total = ctx.dataset.data.reduce((sum, v) => sum + Number(v), 0);
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `$${value.toFixed(2)} (${pct}%)`;
          }
        }
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
    XLSX.utils.book_append_sheet(wb, ws, 'Statistics');
    XLSX.writeFile(wb, `TripWage_${startDate}_${endDate}.xlsx`);
  };

  // 计算当前选中的周期偏移量（-1/0/1 分别对应上一/当前/下一周期），用于高亮 cycle 按钮
  const cycleOffset = (() => {
    const parseLocal = (str) => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const currentStart = parseLocal(getCurrentBiweeklyCycle().start);
    const selectedStart = parseLocal(startDate);
    const cycleDays = wageConfig.biweeklySettlementDays;
    const diffDays = Math.round((selectedStart - currentStart) / (1000 * 60 * 60 * 24));
    if (diffDays % cycleDays !== 0) return null;
    const offset = diffDays / cycleDays;
    // endDate 必须正好是 startDate + (cycleDays - 1) 天才算对齐周期
    const selectedEnd = parseLocal(endDate);
    const expectedEnd = new Date(selectedStart);
    expectedEnd.setDate(selectedStart.getDate() + cycleDays - 1);
    if (selectedEnd.getTime() !== expectedEnd.getTime()) return null;
    return offset;
  })();

  return (
    <div className="stats-container">
      <div className="stats-header">
        {stats.length > 0 && (
          <div className="view-controls">
            <button
              className={viewMode === 'chart' ? 'active' : ''}
              onClick={() => setViewMode('chart')}
            >
              📈 {t('stats.chartView')}
            </button>
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              📋 {t('stats.tableView')}
            </button>
            <button onClick={exportToExcel}>📥 {t('stats.exportExcel')}</button>
          </div>
        )}

        <div className="controls-main">
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <span>{t('common.to')}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <button onClick={loadStats} disabled={loading}>
              {loading ? t('stats.loading') : t('stats.query')}
            </button>
          </div>
          
          <div className="quick-dates">
            <button
              className={cycleOffset === -1 ? 'active' : ''}
              onClick={() => shiftCycle(-1)}
            >
              ‹ {t('stats.prevCycle')}
            </button>
            <button
              className={cycleOffset === 0 ? 'active' : ''}
              onClick={() => shiftCycle(0)}
            >
              {t('stats.currentCycle')}
            </button>
            <button
              className={cycleOffset === 1 ? 'active' : ''}
              onClick={() => shiftCycle(1)}
            >
              {t('stats.nextCycle')} ›
            </button>
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <>
          <div className="summary-cards">
            {/* Work Stats */}
            <div className="summary-card">
              <div className="card-label">{t('stats.cards.workingDays')}</div>
              <div className="card-value">{summary.totalDays} {t('common.days')}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">{t('stats.cards.totalOrders')}</div>
              <div className="card-value">{summary.totalTrips}+{summary.totalLongTrips} orders</div>
            </div>
            <div className="summary-card">
              <div className="card-label">{t('stats.cards.totalWorkHours')}</div>
              <div className="card-value">{summary.totalWorkHours.toFixed(1)} {t('common.hours')}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">{t('stats.cards.totalDistance')}</div>
              <div className="card-value">{summary.totalDistance.toFixed(1)} {t('common.km')}</div>
            </div>
            <div className="summary-card">
              <div className="card-label">Avg {t('tripWage.hourlyRate')}</div>
              <div className="card-value">
                ${summary.totalWorkHours > 0 ? (summary.totalWage / summary.totalWorkHours).toFixed(2) : '0.00'}
              </div>
            </div>
            
            {/* Income Components (Green) */}
            <div className="summary-card income-base">
              <div className="card-label">{t('stats.cards.basePay')}</div>
              <div className="card-value">${summary.totalBasePayment.toFixed(2)}</div>
            </div>
            <div className="summary-card income-fuel">
              <div className="card-label">{t('stats.cards.fuelSubsidy')}</div>
              <div className="card-value">${Math.abs(summary.totalFuel).toFixed(2)}</div>
            </div>
            
            {/* Paycheck from Restaurant (Blue) */}
            <div className="summary-card paycheck">
              <div className="card-label">{t('stats.cards.biweeklyPay')}</div>
              <div className="card-value">${(summary.totalBasePayment + Math.abs(summary.totalFuel)).toFixed(2)}</div>
            </div>
            
            <div className="summary-card income-tips">
              <div className="card-label">{t('stats.cards.totalTips')}</div>
              <div className="card-value">${summary.totalTips.toFixed(2)}</div>
            </div>
            
            {/* Total Earnings (Highlighted) */}
            <div className="summary-card highlight">
              <div className="card-label">{t('stats.cards.totalEarnings')}</div>
              <div className="card-value">${summary.totalWage.toFixed(2)}</div>
            </div>
          </div>

          {viewMode === 'chart' ? (
            <div className="charts-grid">
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
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>{t('stats.table.date')}</th>
                    <th>{t('stats.table.orders')}</th>
                    <th>Long Trips</th>
                    <th>{t('stats.table.effectiveOrders')}</th>
                    <th>{t('stats.table.distance')}</th>
                    <th>{t('stats.table.tips')}</th>
                    <th>{t('stats.table.fuelFee')}</th>
                    <th>{t('stats.table.workHours')}</th>
                    <th>{t('stats.table.basePay')}</th>
                    <th>{t('stats.table.totalWage')}</th>
                    <th>{t('stats.table.hourlyRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats
                    .filter(day => day.actualTrips > 0)
                    .map((day) => (
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
                      <td className="wage-cell">${day.totalWage.toFixed(2)}</td>
                      <td>${day.hourlyWage.toFixed(2)}</td>
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

export default Stats;
