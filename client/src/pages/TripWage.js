import React, { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../services/api';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import wageConfig from '../config/wage.config';
import './TripWage.css';

const TripWage = () => {
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
  
  // 用于追踪正在保存的临时订单ID，防止重复保存
  const savingOrdersRef = useRef(new Set());

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
    // 在前端临时添加一个订单，使用临时ID
    const tempOrder = {
      id: `temp_${Date.now()}`,
      date: currentDate,
      orderNumber: '',
      paymentType: 'online',
      orderValue: 0,
      paymentAmount: 0,
      changeReturned: 0,
      extraCashTip: 0,
      distanceKm: 0,
      notes: '',
      isTemp: true // 标记为临时订单
    };
    
    setOrders([...orders, tempOrder]);
  };

  // 更新订单
  const updateOrder = async (id, field, value) => {
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return;

    const order = orders[orderIndex];
    const updatedOrders = [...orders];
    updatedOrders[orderIndex] = { ...updatedOrders[orderIndex], [field]: value };
    setOrders(updatedOrders);

    // 如果是临时订单且订单号不为空，则保存到数据库
    // 注意：只在订单号失焦时保存，避免每次输入都触发
    if (order.isTemp && field === 'orderNumber' && value && value.trim() !== '') {
      // 临时订单在失焦时才保存，这里只更新状态
      updatedOrders[orderIndex].pendingSave = true;
      setOrders([...updatedOrders]);
    } else if (!order.isTemp) {
      // 如果是已保存的订单，更新数据库
      try {
        await orderService.updateOrder(id, { [field]: value });
      } catch (error) {
        console.error('Failed to update order:', error);
      }
    }
  };

  // 保存临时订单到数据库
  const saveTempOrder = useCallback(async (id) => {
    console.log(`🔵 saveTempOrder called for order: ${id}`);
    
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      console.log(`❌ Order ${id} not found`);
      return;
    }

    const order = orders[orderIndex];
    
    // 防止重复保存：
    // 1. 检查是否是临时订单
    // 2. 检查是否有订单号
    // 3. 检查是否正在保存中（使用 ref 追踪）
    if (!order.isTemp || !order.orderNumber || order.orderNumber.trim() === '') {
      console.log(`⏭️ Skipping save - isTemp: ${order.isTemp}, orderNumber: ${order.orderNumber}`);
      return;
    }
    
    // 使用 ref 追踪，防止并发保存
    if (savingOrdersRef.current.has(id)) {
      console.log(`⚠️ Order ${id} is already being saved, skipping...`);
      return;
    }
    
    savingOrdersRef.current.add(id);
    console.log(`✅ Started saving order ${id}, tracking set size: ${savingOrdersRef.current.size}`);

    try {
      const orderData = { ...order };
      delete orderData.id;
      delete orderData.isTemp;
      delete orderData.pendingSave;
      delete orderData.isSaving;
      
      console.log('📦 Creating order:', orderData);
      const response = await orderService.createOrder(orderData);
      console.log('✅ Order created successfully:', response.data);
      
      // 替换临时订单为真实订单
      setOrders(prevOrders => {
        const newOrders = [...prevOrders];
        const idx = newOrders.findIndex(o => o.id === id);
        if (idx !== -1) {
          newOrders[idx] = response.data;
        }
        return newOrders;
      });
      
      // 保存成功后从追踪中移除
      savingOrdersRef.current.delete(id);
      console.log(`🟢 Finished saving order ${id}, tracking set size: ${savingOrdersRef.current.size}`);
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      alert('Failed to save order');
      
      // 保存失败也要从追踪中移除，允许重试
      savingOrdersRef.current.delete(id);
      console.log(`🔴 Error recovery, removed ${id} from tracking, set size: ${savingOrdersRef.current.size}`);
    }
  }, [orders]);

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
      <div className="tripwage-header">
        <h1>🚗 {t('tripWage.title')}</h1>

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
                <div className="metric-icon">{summary.restaurantSettlement >= 0 ? '🏪💸' : '🏪💵'}</div>
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
        <table>
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
                <td colSpan="13" className="empty-state">
                  {t('tripWage.table.noOrders')}
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const calc = calculateOrder(order);

                return (
                  <tr key={order.id}>
                    <td>{order.date}</td>
                    <td>
                      <input 
                        type="text"
                        value={order.orderNumber}
                        onChange={(e) => updateOrder(order.id, 'orderNumber', e.target.value)}
                        onBlur={() => order.isTemp && saveTempOrder(order.id)}
                        placeholder={t('tripWage.table.orderNumberPlaceholder')}
                      />
                    </td>
                    <td>
                      <select 
                        value={order.paymentType}
                        onChange={(e) => updateOrder(order.id, 'paymentType', e.target.value)}
                      >
                        <option value="online">{t('tripWage.paymentTypes.online')}</option>
                        <option value="card">{t('tripWage.paymentTypes.card')}</option>
                        <option value="cash">{t('tripWage.paymentTypes.cash')}</option>
                        <option value="mixed">{t('tripWage.paymentTypes.mixed')}</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={order.orderValue}
                        onChange={(e) => updateOrder(order.id, 'orderValue', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01"
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={order.paymentAmount}
                        onChange={(e) => updateOrder(order.id, 'paymentAmount', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01"
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={order.changeReturned}
                        onChange={(e) => updateOrder(order.id, 'changeReturned', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01"
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={order.extraCashTip}
                        onChange={(e) => updateOrder(order.id, 'extraCashTip', parseFloat(e.target.value) || 0)}
                        min="0" step="0.01"
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={order.distanceKm}
                        onChange={(e) => updateOrder(order.id, 'distanceKm', parseFloat(e.target.value) || 0)}
                        min="0" step="0.1"
                      />
                    </td>
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
                    <td>
                      <textarea
                        value={order.notes}
                        onChange={(e) => updateOrder(order.id, 'notes', e.target.value)}
                      />
                    </td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteOrder(order.id)}>{t('tripWage.table.delete')}</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {loading && <div className="loading-overlay">Loading...</div>}
    </div>
  );
};

export default TripWage;