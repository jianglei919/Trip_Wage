import { getFirestore } from '../config/firebase.js';

const ordersCollection = 'orders';

// Lazy getter to avoid accessing Firestore before initialization
const db = () => getFirestore();

export class Order {
  constructor(data) {
    this.id = data.id || null;
    this.userId = data.userId;
    this.date = data.date || new Date().toISOString().split('T')[0];
    this.orderNumber = data.orderNumber || '';
    this.paymentType = data.paymentType || 'online';
    this.orderValue = data.orderValue || 0;
    this.paymentAmount = data.paymentAmount || 0;
    this.changeReturned = data.changeReturned || 0;
    this.extraCashTip = data.extraCashTip || 0;
    this.distanceKm = data.distanceKm || 0;
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Save order to Firestore
  async save() {
    const orderData = {
      userId: this.userId,
      date: this.date,
      orderNumber: this.orderNumber,
      paymentType: this.paymentType,
      orderValue: this.orderValue,
      paymentAmount: this.paymentAmount,
      changeReturned: this.changeReturned,
      extraCashTip: this.extraCashTip,
      distanceKm: this.distanceKm,
      notes: this.notes,
      updatedAt: new Date().toISOString()
    };

    if (this.id) {
      // Update existing order
      await db().collection(ordersCollection).doc(this.id).update(orderData);
    } else {
      // Create new order
      orderData.createdAt = this.createdAt;
      const docRef = await db().collection(ordersCollection).add(orderData);
      this.id = docRef.id;
    }

    return this;
  }

  // Find order by ID
  static async findById(id) {
    const doc = await db().collection(ordersCollection).doc(id).get();
    if (!doc.exists) return null;
    
    return new Order({ id: doc.id, ...doc.data() });
  }

  // Find all orders for a user
  static async findByUserId(userId, sortBy = 'date', order = 'desc') {
    const snapshot = await db().collection(ordersCollection)
      .where('userId', '==', userId)
      .orderBy(sortBy, order)
      .get();

    return snapshot.docs.map(doc => new Order({ id: doc.id, ...doc.data() }));
  }

  // Find orders by user and date range
  static async findByUserIdAndDateRange(userId, startDate, endDate) {
    // Get all orders for user first, then filter by date in memory
    // This avoids needing a compound index in Firestore
    const snapshot = await db().collection(ordersCollection)
      .where('userId', '==', userId)
      .get();

    const orders = snapshot.docs
      .map(doc => new Order({ id: doc.id, ...doc.data() }))
      .filter(order => order.date >= startDate && order.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return orders;
  }

  // Find orders by user and specific date
  static async findByUserIdAndDate(userId, date) {
    const snapshot = await db().collection(ordersCollection)
      .where('userId', '==', userId)
      .where('date', '==', date)
      .get();

    return snapshot.docs.map(doc => new Order({ id: doc.id, ...doc.data() }));
  }

  // Update order
  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();
    await db().collection(ordersCollection).doc(id).update(updateData);
    return await this.findById(id);
  }

  // Delete order
  static async delete(id) {
    await db().collection(ordersCollection).doc(id).delete();
    return true;
  }

  // Get statistics for a user by date
  static async getStatsByUserIdAndDate(userId, date) {
    const orders = await this.findByUserIdAndDate(userId, date);
    
    const BASE_HOURLY_RATE = 8.5;
    const FUEL_PER_ORDER = 3.5;
    const LONG_TRIP_THRESHOLD_KM = 10;
    const LONG_TRIP_EXTRA_FUEL = 3.5;

    let totalDistance = 0;
    let totalTips = 0;
    let fuelFeeTotal = 0;
    let effectiveTrips = 0;

    orders.forEach(order => {
      const channelTip = Math.max(0, order.paymentAmount - order.orderValue - order.changeReturned);
      const tipsTotal = channelTip + order.extraCashTip;
      
      let fuelFee = FUEL_PER_ORDER;
      if (order.distanceKm > LONG_TRIP_THRESHOLD_KM) {
        fuelFee += LONG_TRIP_EXTRA_FUEL;
        effectiveTrips += 2;
      } else {
        effectiveTrips += 1;
      }

      totalDistance += order.distanceKm * 2;
      totalTips += tipsTotal;
      fuelFeeTotal += fuelFee;
    });

    return {
      actualTrips: orders.length,
      effectiveTrips,
      totalDistance,
      fuelFeeTotal,
      totalTips
    };
  }

  // Convert to JSON
  toJSON() {
    return { ...this };
  }
}

export default Order;
