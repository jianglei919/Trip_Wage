import { Order, WorkTime } from '../models/index.js';

// Create order
export const createOrder = async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      userId: req.user.id
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all orders for user
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.findByUserId(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get orders by date
export const getOrdersByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const orders = await Order.findByUserIdAndDate(req.user.id, date);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get orders by date range
export const getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = await Order.findByUserIdAndDateRange(req.user.id, startDate, endDate);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedOrder = await Order.update(req.params.id, req.body);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Order.delete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get daily statistics
export const getDailyStats = async (req, res) => {
  try {
    const { date } = req.params;
    const stats = await Order.getStatsByUserIdAndDate(req.user.id, date);
    
    // Get work time for this date
    const workTime = await WorkTime.findByUserIdAndDate(req.user.id, date);
    const workHours = workTime ? workTime.workHours : 0;
    
    const BASE_HOURLY_RATE = 8.5;
    const basePayment = workHours * BASE_HOURLY_RATE;
    const totalWage = basePayment + stats.fuelFeeTotal + stats.totalTips;
    const hourlyWage = workHours > 0 ? totalWage / workHours : 0;

    res.json({
      ...stats,
      workHours,
      basePayment,
      totalWage,
      hourlyWage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save/Update work time
export const saveWorkTime = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    
    // Calculate work hours
    let workHours = 0;
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let hours = endHour - startHour;
      let minutes = endMin - startMin;
      
      if (hours < 0) hours += 24;
      workHours = hours + (minutes / 60);
    }

    let workTime = await WorkTime.findByUserIdAndDate(req.user.id, date);
    
    if (workTime) {
      workTime.startTime = startTime;
      workTime.endTime = endTime;
      workTime.workHours = workHours;
    } else {
      workTime = new WorkTime({
        userId: req.user.id,
        date,
        startTime,
        endTime,
        workHours
      });
    }

    await workTime.save();
    res.json(workTime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get work time by date
export const getWorkTimeByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const workTime = await WorkTime.findByUserIdAndDate(req.user.id, date);
    
    if (!workTime) {
      return res.json({ startTime: '', endTime: '', workHours: 0 });
    }

    res.json(workTime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get historical statistics by date range
export const getHistoricalStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Historical stats request:', { startDate, endDate, userId: req.user.id });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const orders = await Order.findByUserIdAndDateRange(req.user.id, startDate, endDate);
    console.log('Orders found:', orders.length);
    
    // Group orders by date
    const dailyStats = {};
    
    for (const order of orders) {
      const date = order.date;
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          orders: [],
          actualTrips: 0,
          effectiveTrips: 0,
          longTripsCount: 0,
          totalDistance: 0,
          totalTips: 0,
          fuelFeeTotal: 0,
          orderIncome: 0
        };
      }
      
      dailyStats[date].orders.push(order);
      dailyStats[date].actualTrips++;
      
      const LONG_TRIP_THRESHOLD_KM = 10;
      const FUEL_PER_ORDER = 3.5;
      const LONG_TRIP_EXTRA_FUEL = 3.5;
      
      // Calculate effective trips
      if (order.distanceKm >= LONG_TRIP_THRESHOLD_KM) {
        dailyStats[date].effectiveTrips += 2;
        dailyStats[date].longTripsCount += 1;
      } else {
        dailyStats[date].effectiveTrips += 1;
      }
      
      // Calculate distance (match TripWage daily page: round trip counted)
      dailyStats[date].totalDistance += (order.distanceKm || 0) * 2;
      
      // Calculate channel tip
      let channelTip = 0;
      if (order.paymentType === 'online' || order.paymentType === 'card') {
        channelTip = (order.paymentAmount || 0) - (order.orderValue || 0);
      } else if (order.paymentType === 'cash') {
        channelTip = (order.paymentAmount || 0) - (order.orderValue || 0) - (order.changeReturned || 0);
      } else if (order.paymentType === 'mixed') {
        channelTip = (order.paymentAmount || 0) - (order.orderValue || 0) - (order.changeReturned || 0);
      }
      
      const extraCashTip = order.extraCashTip || 0;
      const orderTotalTip = channelTip + extraCashTip;
      
      dailyStats[date].totalTips += orderTotalTip;
      
      // Calculate fuel fee
      let fuelFee = FUEL_PER_ORDER;
      if (order.distanceKm >= LONG_TRIP_THRESHOLD_KM) {
        fuelFee += LONG_TRIP_EXTRA_FUEL;
      }
      dailyStats[date].fuelFeeTotal += fuelFee;
    }
    
    // Get work times for the date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    console.log('Date range:', dates);
    
    const BASE_HOURLY_RATE = 8.5;
    const statsArray = [];
    
    for (const date of dates) {
      const workTime = await WorkTime.findByUserIdAndDate(req.user.id, date);
      const workHours = workTime ? workTime.workHours : 0;
      
      const stats = dailyStats[date] || {
        date,
        actualTrips: 0,
        effectiveTrips: 0,
        longTripsCount: 0,
        totalDistance: 0,
        totalTips: 0,
        fuelFeeTotal: 0,
        orderIncome: 0
      };
      
      const basePayment = workHours * BASE_HOURLY_RATE;
      const totalWage = basePayment + stats.totalTips - stats.fuelFeeTotal;
      const hourlyWage = workHours > 0 ? totalWage / workHours : 0;
      
      statsArray.push({
        ...stats,
        workHours,
        basePayment,
        totalWage,
        hourlyWage
      });
    }
    
    console.log('Stats array length:', statsArray.length);
    res.json(statsArray);
  } catch (error) {
    console.error('Historical stats error:', error);
    res.status(500).json({ error: error.message });
  }
};
