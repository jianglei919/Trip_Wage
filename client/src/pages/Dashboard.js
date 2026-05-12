import React, { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/api';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import wageConfig from '../config/wage.config';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  
  // 获取本地日期（避免 UTC 时区问题）
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [currentDate, setCurrentDate] = useState(getLocalDateString());
  const [orders, setOrders] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workHours, setWorkHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingNewOrder, setIsSavingNewOrder] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEditOrder, setIsSavingEditOrder] = useState(false);
  const buildEmptyOrder = useCallback(() => ({
    date: currentDate,
    orderNumber: '',
    paymentType: 'online',
    orderValue: 0,
    paymentAmount: 0,
    changeReturned: 0,
    extraCashTip: 0,
    tip: 0,
    distanceKm: 0,
    notes: ''
  }), [currentDate]);
  const [newOrder, setNewOrder] = useState(buildEmptyOrder);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showMobileSettleDetails, setShowMobileSettleDetails] = useState(false);
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  useEffect(() => {
    if (!isAddModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isEditModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isEditModalOpen]);
  
  // 加载指定日期的数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载订单
      const ordersRes = await orderService.getOrdersByDate(currentDate);
      setOrders(ordersRes.data);

      // 加载工作时间
      const workTimeRes = await orderService.getWorkTime(currentDate);
      if (workTimeRes.data) {
        setStartTime(workTimeRes.data.startTime || '');
        setEndTime(workTimeRes.data.endTime || '');
        setWorkHours(workTimeRes.data.workHours || 0);
      } else {
        setStartTime('');
        setEndTime('');
        setWorkHours(0);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 计算工作时长
  const calculateWorkHours = (start, end) => {
    if (!start || !end) return 0;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (hours < 0) hours += 24;
    return hours + (minutes / 60);
  };

  // 更新工作时间
  const updateWorkTime = async (newStart, newEnd) => {
    const hours = calculateWorkHours(newStart, newEnd);
    setWorkHours(hours);

    try {
      await orderService.saveWorkTime({
        date: currentDate,
        startTime: newStart,
        endTime: newEnd
      });
    } catch (error) {
      console.error('Failed to save work time:', error);
    }
  };

  // 计算单个订单
  const calculateOrder = (order) => {
    // 总小费 = max(0, 实收 - 订单金额 - 找零 + 额外现金小费)
    const tipsTotal = Math.max(0, order.paymentAmount - order.orderValue - order.changeReturned + order.extraCashTip);
    
    // 油费补贴：基础值，长单额外补贴
    let fuelFee = wageConfig.fuelPerOrder;
    if (order.distanceKm >= wageConfig.longTripThresholdKm) {
      fuelFee += wageConfig.longTripExtraFuel;
    }
    
    // 总收入 = 油费补贴 + 总小费
    const totalIncome = fuelFee + tipsTotal;

    return { tipsTotal, fuelFee, totalIncome };
  };

  // 计算每日汇总
  const calculateDailySummary = () => {
    let totalDistance = 0;
    let totalTips = 0;
    let fuelFeeTotal = 0;
    let effectiveTrips = 0;
    let cashOrderValue = 0; // Cash支付的Order Value总和
    let nonCashTips = 0; // Online/Card支付时餐馆需要支付给我的小费总和

    orders.forEach(order => {
      const calc = calculateOrder(order);
      totalDistance += order.distanceKm * 2;
      totalTips += calc.tipsTotal;
      fuelFeeTotal += calc.fuelFee;

      if (order.distanceKm >= wageConfig.longTripThresholdKm) {
        effectiveTrips += 2; // 长单贡献2
      } else {
        effectiveTrips += 1;
      }
      
      // 餐馆结账计算
      if (order.paymentType === 'cash') {
        // Cash支付：Order Value 是我需要支付给餐馆的
        cashOrderValue += order.orderValue;
      } else if (order.paymentType === 'online' || order.paymentType === 'card') {
        // Online/Card支付：Payment Amt - Order Value 如果 > 0，是餐馆需要支付给我的
        const tipFromRestaurant = order.paymentAmount - order.orderValue;
        if (tipFromRestaurant > 0) {
          nonCashTips += tipFromRestaurant;
        }
      }
    });

    const basePayment = workHours * wageConfig.baseHourlyRate;
    const totalWage = basePayment + fuelFeeTotal + totalTips;
    const hourlyWage = workHours > 0 ? totalWage / workHours : 0;
    
    // 餐馆结账：我支付给餐馆的 - 餐馆支付给我的
    // 正数表示我需要支付给餐馆，负数表示餐馆需要支付给我
    const restaurantSettlement = cashOrderValue - nonCashTips;

    return {
      actualTrips: orders.length,
      effectiveTrips,
      totalDistance,
      basePayment,
      fuelFeeTotal,
      totalTips,
      totalWage,
      hourlyWage,
      cashOrderValue,
      nonCashTips,
      restaurantSettlement
    };
  };

  // 添加新订单
  const addOrder = () => {
    setNewOrder(buildEmptyOrder());
    setIsAddModalOpen(true);
  };

  const handleNewOrderChange = (field, value) => {
    setNewOrder(prev => ({ ...prev, [field]: value }));
  };

  const handleEditOrderChange = (field, value) => {
    setEditingOrder(prev => ({ ...prev, [field]: value }));
  };

  const openEditOrder = (order) => {
    const derivedTip = (order.paymentType === 'online' || order.paymentType === 'card')
      ? Math.max(0, Math.round((Number(order.paymentAmount) - Number(order.orderValue)) * 100) / 100)
      : 0;
    setEditingOrder({ ...order, tip: derivedTip });
    setIsEditModalOpen(true);
  };

  // Online/Card 模式下，paymentAmount = orderValue + tip
  const computePaymentAmount = (order) => {
    if (order.paymentType === 'online' || order.paymentType === 'card') {
      return (Number(order.orderValue) || 0) + (Number(order.tip) || 0);
    }
    return Number(order.paymentAmount) || 0;
  };

  const saveNewOrder = async () => {
    setIsSavingNewOrder(true);
    try {
      const payload = {
        ...newOrder,
        date: newOrder.date || currentDate,
        orderValue: Number(newOrder.orderValue) || 0,
        paymentAmount: computePaymentAmount(newOrder),
        changeReturned: Number(newOrder.changeReturned) || 0,
        extraCashTip: Number(newOrder.extraCashTip) || 0,
        distanceKm: Number(newOrder.distanceKm) || 0
      };
      delete payload.tip;

      const response = await orderService.createOrder(payload);
      setOrders(prev => [...prev, response.data]);
      setIsAddModalOpen(false);
      setNewOrder(buildEmptyOrder());
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(t('tripWage.addOrderModal.saveFailed'));
    } finally {
      setIsSavingNewOrder(false);
    }
  };

  const closeAddOrderModal = () => {
    if (isSavingNewOrder) return;
    setIsAddModalOpen(false);
  };

  const closeEditOrderModal = () => {
    if (isSavingEditOrder) return;
    setIsEditModalOpen(false);
    setEditingOrder(null);
  };

  const saveEditOrder = async () => {
    if (!editingOrder) return;
    setIsSavingEditOrder(true);
    try {
      const payload = {
        ...editingOrder,
        date: editingOrder.date || currentDate,
        orderValue: Number(editingOrder.orderValue) || 0,
        paymentAmount: computePaymentAmount(editingOrder),
        changeReturned: Number(editingOrder.changeReturned) || 0,
        extraCashTip: Number(editingOrder.extraCashTip) || 0,
        distanceKm: Number(editingOrder.distanceKm) || 0
      };
      delete payload.tip;

      await orderService.updateOrder(editingOrder.id, payload);
      setOrders(prev => prev.map(o => (o.id === editingOrder.id ? { ...o, ...payload } : o)));
      setIsEditModalOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Failed to update order:', error);
      alert(t('tripWage.editOrderModal.saveFailed'));
    } finally {
      setIsSavingEditOrder(false);
    }
  };

  // 删除订单
  const deleteOrder = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // 构建确认消息
    const orderInfo = order.isTemp 
      ? `Temp Order (not saved yet)`
      : `Order #${order.orderNumber} on ${order.date}\nPayment: $${order.paymentAmount} (${order.paymentType})`;
    
    if (!window.confirm(`Delete this order?\n\n${orderInfo}\n\nThis action cannot be undone.`)) {
      return;
    }
    
    // 如果是临时订单，直接从前端删除
    if (order && order.isTemp) {
      setOrders(orders.filter(o => o.id !== id));
      return;
    }

    // 如果是已保存的订单，调用API删除
    try {
      await orderService.deleteOrder(id);
      setOrders(orders.filter(o => o.id !== id));
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order');
    }
  };

  // 导出Excel
  const exportExcel = () => {
    // 只导出已保存的订单（有订单号的）
    const savedOrders = orders.filter(o => !o.isTemp && o.orderNumber);
    
    if (!savedOrders.length) {
      alert('No order data to export');
      return;
    }

    const sheetData = [
      ["Date", "Order#", "Payment", "Order Value", "Payment Amt", "Change", "Extra Cash Tip", "Distance(km)", "Long Trip", "Total Tips", "Fuel Fee", "Total Income", "Notes"]
    ];

    savedOrders.forEach(order => {
      const calc = calculateOrder(order);
      sheetData.push([
        order.date,
        order.orderNumber,
        order.paymentType,
        order.orderValue,
        order.paymentAmount,
        order.changeReturned,
        order.extraCashTip,
        order.distanceKm,
        order.distanceKm >= wageConfig.longTripThresholdKm ? 'Yes' : 'No',
        calc.tipsTotal,
        calc.fuelFee,
        calc.totalIncome,
        order.notes
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order Details");
    XLSX.writeFile(wb, `tripwage-orders-${currentDate}.xlsx`);
  };

  // 日期导航
  const setToday = () => setCurrentDate(new Date().toISOString().split('T')[0]);
  const prevDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(date.toISOString().split('T')[0]);
  };
  const nextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  const summary = calculateDailySummary();
  const baseAndFuel = summary.basePayment + summary.fuelFeeTotal;
  const longTrips = summary.effectiveTrips - summary.actualTrips;
  // 关键指标卡片数据
  const keyMetrics = [
    {
      label: t('tripWage.totalTips'),
      value: `$${summary.totalTips.toFixed(2)}`,
      icon: '💵',
      className: 'metric-tips'
    },
    {
      label: t('tripWage.orders'),
      value: longTrips > 0 ? `${summary.actualTrips}+${longTrips}` : `${summary.actualTrips}`,
      icon: '📦',
      className: 'metric-trips'
    },
    {
      label: t('tripWage.totalDistance'),
      value: `${summary.totalDistance.toFixed(1)} ${t('common.km')}`,
      icon: '🚗',
      className: 'metric-distance'
    },
    {
      label: t('tripWage.hourlyRate'),
      value: `$${summary.hourlyWage.toFixed(2)}/${t('common.hours')}`,
      icon: '⏱️',
      className: 'metric-hourly'
    }
  ];

  return (
    <div className="tripwage-container">
      {/* 移动端：紧凑头部 */}
      <div className="tripwage-mobile-header">
        {showMobileDatePicker && (
          <div className="tripwage-mobile-datepanel">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
            />
            <div className="tripwage-mobile-datebtns">
              <button onClick={prevDay}>‹ {t('tripWage.previous')}</button>
              <button onClick={setToday}>{t('tripWage.today')}</button>
              <button onClick={nextDay}>{t('tripWage.next')} ›</button>
            </div>
          </div>
        )}

        <div
          className="tripwage-mobile-income"
          onClick={() => setShowMobileDetails(v => !v)}
        >
          <div className="tripwage-mobile-income-top">
            <div className="tripwage-mobile-income-label">{t('tripWage.totalIncome')}</div>
            <button
              className="tripwage-date-pill"
              onClick={(e) => { e.stopPropagation(); setShowMobileDatePicker(v => !v); }}
            >
              📅 {currentDate.slice(5)}
            </button>
          </div>
          <div className="tripwage-mobile-income-bottom">
            <div className="tripwage-mobile-income-value">${summary.totalWage.toFixed(2)}</div>
            <div className="tripwage-mobile-income-toggle">
              {t('tripWage.details')} {showMobileDetails ? '▴' : '▾'}
            </div>
          </div>
        </div>

        {showMobileDetails && (
          <div className="tripwage-mobile-details">
            <div className="tripwage-mobile-details-row">
              <span>⏱ {t('tripWage.workTime')}</span>
              <div className="tripwage-mobile-worktime">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); updateWorkTime(e.target.value, endTime); }}
                />
                <span>-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); updateWorkTime(startTime, e.target.value); }}
                />
                <span className="tripwage-mobile-hours">{workHours.toFixed(1)}h</span>
              </div>
            </div>
            <div className="tripwage-mobile-details-grid">
              <div className="metric-tips"><span>💵</span> {t('tripWage.totalTips')}<b>${summary.totalTips.toFixed(2)}</b></div>
              <div className="metric-trips"><span>📦</span> {t('tripWage.orders')}<b>{longTrips > 0 ? `${summary.actualTrips}+${longTrips}` : summary.actualTrips}</b></div>
              <div className="metric-distance"><span>🚗</span> {t('tripWage.totalDistance')}<b>{summary.totalDistance.toFixed(1)}km</b></div>
              <div className="metric-hourly"><span>⏱</span> {t('tripWage.hourlyRate')}<b>${summary.hourlyWage.toFixed(2)}/h</b></div>
            </div>
            <button className="tripwage-mobile-export" onClick={exportExcel}>
              📊 {t('tripWage.exportExcel')}
            </button>
          </div>
        )}
      </div>

      <div className="tripwage-header">
        <div className="top-bar">
          <div className="date-time-group">
            <div className="date-selector compact">
              <input 
                className="compact-input"
                type="date" 
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
              />
              <button onClick={setToday}>{t('tripWage.today')}</button>
              <button onClick={prevDay}>{t('tripWage.previous')}</button>
              <button onClick={nextDay}>{t('tripWage.next')}</button>
            </div>
            <div className="work-hours-input compact">
              <input 
                className="compact-input"
                type="time" 
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  updateWorkTime(e.target.value, endTime);
                }}
                placeholder="开始"
              />
              <span className="separator">-</span>
              <input 
                className="compact-input"
                type="time" 
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  updateWorkTime(startTime, e.target.value);
                }}
                placeholder="结束"
              />
              <div className="hours-display">{workHours.toFixed(1)}{t('common.hours')}</div>
            </div>
          </div>
          <div className="metrics-cards">
            <div className="metrics-four">
              {keyMetrics.map(m => (
                <div key={m.label} className={`metric-card ${m.className}`}>
                  <div className="metric-icon">{m.icon}</div>
                  <div className="metric-info">
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value">{m.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="metrics-duo">
              <div className="metric-card metric-income">
                <div className="metric-icon">💰</div>
                <div className="metric-info">
                  <div className="metric-label">{t('tripWage.totalIncome')}</div>
                  <div className="metric-value">${summary.totalWage.toFixed(2)}</div>
                  <div className="metric-sub">{t('tripWage.baseAndFuel')} ${baseAndFuel.toFixed(2)} + {t('tripWage.totalTips')} ${summary.totalTips.toFixed(2)}</div>
                </div>
              </div>
              <div className={`metric-card ${summary.restaurantSettlement >= 0 ? 'metric-settlement-pay' : 'metric-settlement-receive'}`}>
                <div className="metric-icon">{summary.restaurantSettlement >= 0 ? '🏪' : '🏪'}</div>
                <div className="metric-info">
                  <div className="metric-label">{t('tripWage.restaurantSettlement')}</div>
                  <div className="metric-value">
                    ${summary.restaurantSettlement.toFixed(2)}
                  </div>
                  <div className="metric-detail">
                    {t('tripWage.cashOrders')}: ${summary.cashOrderValue.toFixed(2)} - {t('tripWage.tipsFromRestaurant')}: ${summary.nonCashTips.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={addOrder}>➕ {t('tripWage.addOrder')}</button>
        <button onClick={exportExcel}>📊 {t('tripWage.exportExcel')}</button>
      </div>

      <div className="table-container">
        <table className="tripwage-table">
          <thead>
            <tr>
              <th>{t('tripWage.table.date')}</th>
              <th>{t('tripWage.table.orderNumber')}</th>
              <th>{t('tripWage.table.payment')}</th>
              <th>{t('tripWage.table.orderValue')}</th>
              <th>{t('tripWage.table.paymentAmt')}</th>
              <th>{t('tripWage.table.change')}</th>
              <th>{t('tripWage.table.extraTip')}</th>
              <th>{t('tripWage.table.distance')}</th>
              <th>{t('tripWage.table.longTrip')}</th>
              <th>{t('tripWage.table.totalTips')}</th>
              <th>{t('tripWage.table.fuelFee')}</th>
              <th>{t('tripWage.table.totalIncome')}</th>
              <th>{t('tripWage.table.notes')}</th>
              <th>{t('tripWage.table.action')}</th>
              </tr>
            </thead>
            <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="empty-state">
                      {t('tripWage.table.noOrders')}
                    </td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const calc = calculateOrder(order);

                    return (
                      <tr key={order.id} className="clickable-row" onClick={() => openEditOrder(order)}>
                        <td>{order.date}</td>
                        <td>{order.orderNumber || '-'}</td>
                        <td>{t(`tripWage.paymentTypes.${order.paymentType}`)}</td>
                        <td>${Number(order.orderValue).toFixed(2)}</td>
                        <td>${Number(order.paymentAmount).toFixed(2)}</td>
                        <td>${Number(order.changeReturned).toFixed(2)}</td>
                        <td>${Number(order.extraCashTip).toFixed(2)}</td>
                        <td>{Number(order.distanceKm).toFixed(1)}</td>
                        <td className="calculated">
                          {order.distanceKm >= wageConfig.longTripThresholdKm ? (
                            <span className="long-trip-badge">{t('tripWage.table.longTripBadge')}</span>
                          ) : (
                            <span className="normal-trip-badge">{t('tripWage.table.normalTripBadge')}</span>
                          )}
                        </td>
                        <td className="calculated">${calc.tipsTotal.toFixed(2)}</td>
                        <td className="calculated">${calc.fuelFee.toFixed(2)}</td>
                        <td className="calculated">${calc.totalIncome.toFixed(2)}</td>
                        <td>{order.notes || '-'}</td>
                        <td>
                          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}>
                            {t('tripWage.table.delete')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

            <div className="tripwage-cards">
              {orders.length === 0 ? (
                <div className="empty-state">{t('tripWage.table.noOrders')}</div>
              ) : (
                orders.map(order => {
                  const calc = calculateOrder(order);
                  const isLong = order.distanceKm >= wageConfig.longTripThresholdKm;
                  return (
                    <div
                      key={order.id}
                      className="tripwage-card"
                      onClick={() => openEditOrder(order)}
                    >
                      <div className="tripwage-card-main">
                        <div className="tripwage-card-id">
                          <span className="tripwage-card-order">#{order.orderNumber || '-'}</span>
                          <span className={`payment-chip payment-${order.paymentType}`}>
                            {t(`tripWage.paymentTypes.${order.paymentType}`)}
                          </span>
                        </div>
                        <div className="tripwage-card-income">
                          <div className="tripwage-card-income-value">${calc.totalIncome.toFixed(2)}</div>
                          <div className="tripwage-card-income-label">{t('tripWage.table.totalIncome')}</div>
                        </div>
                      </div>
                      <div className="tripwage-card-foot">
                        <span className="tripwage-card-tips">
                          💵 {t('tripWage.table.totalTips')} ${calc.tipsTotal.toFixed(2)}
                        </span>
                        {isLong && (
                          <span className="long-trip-badge">{t('tripWage.table.longTripBadge')}</span>
                        )}
                        <button
                          className="tripwage-card-delete"
                          onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                          aria-label={t('tripWage.table.delete')}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {isEditModalOpen && editingOrder && (
          <div className="order-modal-overlay" onClick={closeEditOrderModal}>
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
              <div className="order-modal-header">
                <div>
                  <div className="order-modal-title">{t('tripWage.editOrderModal.title')}</div>
                  <div className="order-modal-sub">{t('tripWage.editOrderModal.description')}</div>
                </div>
                <button
                  type="button"
                  className="order-modal-close"
                  onClick={closeEditOrderModal}
                  aria-label={t('tripWage.editOrderModal.cancel')}
                >
                  ×
                </button>
              </div>

              <div className="order-modal-grid">
                <label>
                  <span>{t('tripWage.table.date')}</span>
                  <input
                    type="date"
                    value={editingOrder.date}
                    onChange={(e) => handleEditOrderChange('date', e.target.value)}
                  />
                </label>
                <label>
                  <span>{t('tripWage.table.orderNumber')}</span>
                  <input
                    type="text"
                    value={editingOrder.orderNumber}
                    onChange={(e) => handleEditOrderChange('orderNumber', e.target.value)}
                    placeholder={t('tripWage.table.orderNumberPlaceholder')}
                  />
                </label>
                <label>
                  <span>{t('tripWage.table.payment')}</span>
                  <select
                    value={editingOrder.paymentType}
                    onChange={(e) => handleEditOrderChange('paymentType', e.target.value)}
                  >
                    <option value="online">{t('tripWage.paymentTypes.online')}</option>
                    <option value="card">{t('tripWage.paymentTypes.card')}</option>
                    <option value="cash">{t('tripWage.paymentTypes.cash')}</option>
                    <option value="mixed">{t('tripWage.paymentTypes.mixed')}</option>
                  </select>
                </label>
                <label>
                  <span>{t('tripWage.table.orderValue')}</span>
                  <input
                    type="number"
                    value={editingOrder.orderValue}
                    min="0"
                    step="0.01"
                    onChange={(e) => handleEditOrderChange('orderValue', e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                {(editingOrder.paymentType === 'online' || editingOrder.paymentType === 'card') && (
                  <label>
                    <span>{t('tripWage.table.tip')}</span>
                    <input
                      type="number"
                      value={editingOrder.tip}
                      min="0"
                      step="0.01"
                      onChange={(e) => handleEditOrderChange('tip', e.target.value)}
                      inputMode="decimal"
                    />
                  </label>
                )}
                {(editingOrder.paymentType === 'cash' || editingOrder.paymentType === 'mixed') && (
                  <>
                    <label>
                      <span>{t('tripWage.table.paymentAmt')}</span>
                      <input
                        type="number"
                        value={editingOrder.paymentAmount}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleEditOrderChange('paymentAmount', e.target.value)}
                        inputMode="decimal"
                      />
                    </label>
                    <label>
                      <span>{t('tripWage.table.change')}</span>
                      <input
                        type="number"
                        value={editingOrder.changeReturned}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleEditOrderChange('changeReturned', e.target.value)}
                        inputMode="decimal"
                      />
                    </label>
                    <label>
                      <span>{t('tripWage.table.extraTip')}</span>
                      <input
                        type="number"
                        value={editingOrder.extraCashTip}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleEditOrderChange('extraCashTip', e.target.value)}
                        inputMode="decimal"
                      />
                    </label>
                  </>
                )}
                <label>
                  <span>{t('tripWage.table.distance')}</span>
                  <input
                    type="number"
                    value={editingOrder.distanceKm}
                    min="0"
                    step="0.1"
                    onChange={(e) => handleEditOrderChange('distanceKm', e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="order-modal-notes">
                  <span>{t('tripWage.table.notes')}</span>
                  <textarea
                    value={editingOrder.notes}
                    onChange={(e) => handleEditOrderChange('notes', e.target.value)}
                    rows="3"
                  />
                </label>
              </div>

              <div className="order-modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={closeEditOrderModal}
                  disabled={isSavingEditOrder}
                >
                  {t('tripWage.editOrderModal.cancel')}
                </button>
                <button
                  type="button"
                  onClick={saveEditOrder}
                  disabled={isSavingEditOrder}
                >
                  {isSavingEditOrder ? t('tripWage.editOrderModal.saving') : t('tripWage.editOrderModal.save')}
                </button>
              </div>
            </div>
          </div>
        )}

      {isAddModalOpen && (
        <div className="order-modal-overlay" onClick={closeAddOrderModal}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <div className="order-modal-title">{t('tripWage.addOrderModal.title')}</div>
                <div className="order-modal-sub">{t('tripWage.addOrderModal.description')}</div>
              </div>
              <button
                type="button"
                className="order-modal-close"
                onClick={closeAddOrderModal}
                aria-label={t('tripWage.addOrderModal.cancel')}
              >
                ×
              </button>
            </div>

            <div className="order-modal-grid">
              <label>
                <span>{t('tripWage.table.date')}</span>
                <input
                  type="date"
                  value={newOrder.date}
                  onChange={(e) => handleNewOrderChange('date', e.target.value)}
                />
              </label>
              <label>
                <span>{t('tripWage.table.orderNumber')}</span>
                <input
                  type="text"
                  value={newOrder.orderNumber}
                  onChange={(e) => handleNewOrderChange('orderNumber', e.target.value)}
                  placeholder={t('tripWage.table.orderNumberPlaceholder')}
                />
              </label>
              <label>
                <span>{t('tripWage.table.payment')}</span>
                <select
                  value={newOrder.paymentType}
                  onChange={(e) => handleNewOrderChange('paymentType', e.target.value)}
                >
                  <option value="online">{t('tripWage.paymentTypes.online')}</option>
                  <option value="card">{t('tripWage.paymentTypes.card')}</option>
                  <option value="cash">{t('tripWage.paymentTypes.cash')}</option>
                  <option value="mixed">{t('tripWage.paymentTypes.mixed')}</option>
                </select>
              </label>
              <label>
                <span>{t('tripWage.table.orderValue')}</span>
                <input
                  type="number"
                  value={newOrder.orderValue}
                  min="0"
                  step="0.01"
                  onChange={(e) => handleNewOrderChange('orderValue', e.target.value)}
                />
              </label>
              {(newOrder.paymentType === 'online' || newOrder.paymentType === 'card') && (
                <label>
                  <span>{t('tripWage.table.tip')}</span>
                  <input
                    type="number"
                    value={newOrder.tip}
                    min="0"
                    step="0.01"
                    onChange={(e) => handleNewOrderChange('tip', e.target.value)}
                    inputMode="decimal"
                  />
                </label>
              )}
              {(newOrder.paymentType === 'cash' || newOrder.paymentType === 'mixed') && (
                <>
                  <label>
                    <span>{t('tripWage.table.paymentAmt')}</span>
                    <input
                      type="number"
                      value={newOrder.paymentAmount}
                      min="0"
                      step="0.01"
                      onChange={(e) => handleNewOrderChange('paymentAmount', e.target.value)}
                    />
                  </label>
                  <label>
                    <span>{t('tripWage.table.change')}</span>
                    <input
                      type="number"
                      value={newOrder.changeReturned}
                      min="0"
                      step="0.01"
                      onChange={(e) => handleNewOrderChange('changeReturned', e.target.value)}
                    />
                  </label>
                  <label>
                    <span>{t('tripWage.table.extraTip')}</span>
                    <input
                      type="number"
                      value={newOrder.extraCashTip}
                      min="0"
                      step="0.01"
                      onChange={(e) => handleNewOrderChange('extraCashTip', e.target.value)}
                    />
                  </label>
                </>
              )}
              <label>
                <span>{t('tripWage.table.distance')}</span>
                <input
                  type="number"
                  value={newOrder.distanceKm}
                  min="0"
                  step="0.1"
                  onChange={(e) => handleNewOrderChange('distanceKm', e.target.value)}
                />
              </label>
              <label className="order-modal-notes">
                <span>{t('tripWage.table.notes')}</span>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => handleNewOrderChange('notes', e.target.value)}
                  rows="3"
                />
              </label>
            </div>

            <div className="order-modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={closeAddOrderModal}
                disabled={isSavingNewOrder}
              >
                {t('tripWage.addOrderModal.cancel')}
              </button>
              <button
                type="button"
                onClick={saveNewOrder}
                disabled={isSavingNewOrder}
              >
                {isSavingNewOrder ? t('tripWage.addOrderModal.saving') : t('tripWage.addOrderModal.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading-overlay">Loading...</div>}

      {/* 移动端：右下 FAB 加单 */}
      <button
        className="tripwage-fab"
        onClick={addOrder}
        aria-label={t('tripWage.addOrder')}
      >
        ➕
      </button>

      {/* 移动端：底部固定对账卡 */}
      <div className={`tripwage-settle-bar ${summary.restaurantSettlement >= 0 ? 'owe' : 'receive'}`}>
        <div
          className="tripwage-settle-main"
          onClick={() => setShowMobileSettleDetails(v => !v)}
        >
          <div className="tripwage-settle-label">
            🏪 {summary.restaurantSettlement >= 0 ? t('tripWage.youOweRestaurant') : t('tripWage.restaurantOwesYou')}
          </div>
          <div className="tripwage-settle-value">
            ${Math.abs(summary.restaurantSettlement).toFixed(2)}
            <span className="tripwage-settle-caret">{showMobileSettleDetails ? '▾' : '▴'}</span>
          </div>
        </div>
        {showMobileSettleDetails && (
          <div className="tripwage-settle-details">
            <div>
              <span>{t('tripWage.cashOrders')}</span>
              <b>${summary.cashOrderValue.toFixed(2)}</b>
            </div>
            <div>
              <span>{t('tripWage.tipsFromRestaurant')}</span>
              <b>-${summary.nonCashTips.toFixed(2)}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;