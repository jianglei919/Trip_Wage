// 数据库适配器 - 根据配置选择使用 MongoDB 或 Firebase
// 必须先加载环境变量
import '../config/env.js';
import { User as FirebaseUser } from './User.js';
import { Order as FirebaseOrder } from './Trip.js';
import { WorkTime as FirebaseWorkTime } from './WorkTime.js';
import UserModel from './mongodb/UserModel.js';
import OrderModel from './mongodb/OrderModel.js';
import WorkTimeModel from './mongodb/WorkTimeModel.js';
import bcrypt from 'bcryptjs';

const DB_TYPE = process.env.DB_TYPE || 'firebase';
const DUAL = String(process.env.DB_DUAL_WRITE || '').toLowerCase() === 'true';
const READ_PRIMARY = (process.env.READ_PRIMARY || 'mongodb').toLowerCase();

console.log(`🔧 Database adapter initialized with: ${DUAL ? 'DUAL-WRITE' : DB_TYPE.toUpperCase()}`);

// ==================== User Adapter ====================
class UserAdapter {
  constructor(data) {
    if (DB_TYPE === 'mongodb') {
      // MongoDB 实例
      if (data._id) {
        this.id = data._id.toString();
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.role = data.role;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
      } else {
        Object.assign(this, data);
      }
    } else {
      // Firebase 实例
      const fbUser = new FirebaseUser(data);
      Object.assign(this, fbUser);
    }
  }

  async hashPassword() {
    if (DB_TYPE === 'mongodb') {
      if (this.password && !this.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
    } else {
      const fbUser = new FirebaseUser(this);
      await fbUser.hashPassword();
      this.password = fbUser.password;
    }
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async save() {
    if (DB_TYPE === 'mongodb') {
      await this.hashPassword();
      
      if (this.id) {
        // 更新
        const updated = await UserModel.findByIdAndUpdate(
          this.id,
          {
            username: this.username,
            email: this.email,
            password: this.password,
            role: this.role
          },
          { new: true }
        );
        Object.assign(this, {
          id: updated._id.toString(),
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        });
      } else {
        // 创建
        const newUser = await UserModel.create({
          username: this.username,
          email: this.email,
          password: this.password,
          role: this.role
        });
        this.id = newUser._id.toString();
        this.createdAt = newUser.createdAt;
        this.updatedAt = newUser.updatedAt;
      }
    } else {
      const fbUser = new FirebaseUser(this);
      await fbUser.save();
      Object.assign(this, fbUser);
    }
    return this;
  }

  static async findById(id) {
    if (DB_TYPE === 'mongodb') {
      const user = await UserModel.findById(id);
      return user ? new UserAdapter(user) : null;
    } else {
      const user = await FirebaseUser.findById(id);
      return user ? new UserAdapter(user) : null;
    }
  }

  static async findByEmail(email) {
    if (DB_TYPE === 'mongodb') {
      const user = await UserModel.findOne({ email });
      return user ? new UserAdapter(user) : null;
    } else {
      const user = await FirebaseUser.findByEmail(email);
      return user ? new UserAdapter(user) : null;
    }
  }

  static async findByUsername(username) {
    if (DB_TYPE === 'mongodb') {
      const user = await UserModel.findOne({ username });
      return user ? new UserAdapter(user) : null;
    } else {
      const user = await FirebaseUser.findByUsername(username);
      return user ? new UserAdapter(user) : null;
    }
  }

  static async findByEmailOrUsername(email, username) {
    const emailUser = await this.findByEmail(email);
    if (emailUser) return emailUser;
    return await this.findByUsername(username);
  }

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}

// ==================== Order Adapter ====================
class OrderAdapter {
  constructor(data) {
    if (DB_TYPE === 'mongodb') {
      if (data._id) {
        this.id = data._id.toString();
        this.userId = data.userId;
        this.date = data.date;
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
      } else {
        Object.assign(this, data);
        if (!this.date) this.date = new Date().toISOString().split('T')[0];
      }
    } else {
      const fbOrder = new FirebaseOrder(data);
      Object.assign(this, fbOrder);
    }
  }

  async save() {
    if (DB_TYPE === 'mongodb') {
      if (this.id) {
        // 更新
        const updated = await OrderModel.findByIdAndUpdate(
          this.id,
          {
            userId: this.userId,
            date: this.date,
            orderNumber: this.orderNumber,
            paymentType: this.paymentType,
            orderValue: this.orderValue,
            paymentAmount: this.paymentAmount,
            changeReturned: this.changeReturned,
            extraCashTip: this.extraCashTip,
            distanceKm: this.distanceKm,
            notes: this.notes
          },
          { new: true }
        );
        Object.assign(this, {
          id: updated._id.toString(),
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        });
      } else {
        // 创建
        const newOrder = await OrderModel.create({
          userId: this.userId,
          date: this.date,
          orderNumber: this.orderNumber,
          paymentType: this.paymentType,
          orderValue: this.orderValue,
          paymentAmount: this.paymentAmount,
          changeReturned: this.changeReturned,
          extraCashTip: this.extraCashTip,
          distanceKm: this.distanceKm,
          notes: this.notes
        });
        this.id = newOrder._id.toString();
        this.createdAt = newOrder.createdAt;
        this.updatedAt = newOrder.updatedAt;
      }
    } else {
      const fbOrder = new FirebaseOrder(this);
      await fbOrder.save();
      Object.assign(this, fbOrder);
    }
    return this;
  }

  static async findById(id) {
    if (DB_TYPE === 'mongodb') {
      const order = await OrderModel.findById(id);
      return order ? new OrderAdapter(order) : null;
    } else {
      const order = await FirebaseOrder.findById(id);
      return order ? new OrderAdapter(order) : null;
    }
  }

  static async findByUserId(userId, sortBy = 'date', order = 'desc') {
    if (DB_TYPE === 'mongodb') {
      const sortOrder = order === 'desc' ? -1 : 1;
      const orders = await OrderModel.find({ userId })
        .sort({ [sortBy]: sortOrder });
      return orders.map(o => new OrderAdapter(o));
    } else {
      const orders = await FirebaseOrder.findByUserId(userId, sortBy, order);
      return orders.map(o => new OrderAdapter(o));
    }
  }

  static async findByUserIdAndDateRange(userId, startDate, endDate) {
    if (DB_TYPE === 'mongodb') {
      const orders = await OrderModel.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });
      return orders.map(o => new OrderAdapter(o));
    } else {
      const orders = await FirebaseOrder.findByUserIdAndDateRange(userId, startDate, endDate);
      return orders.map(o => new OrderAdapter(o));
    }
  }

  static async findByUserIdAndDate(userId, date) {
    if (DB_TYPE === 'mongodb') {
      const orders = await OrderModel.find({ userId, date });
      return orders.map(o => new OrderAdapter(o));
    } else {
      const orders = await FirebaseOrder.findByUserIdAndDate(userId, date);
      return orders.map(o => new OrderAdapter(o));
    }
  }

  static async update(id, updateData) {
    if (DB_TYPE === 'mongodb') {
      const updated = await OrderModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      return updated ? new OrderAdapter(updated) : null;
    } else {
      const order = await FirebaseOrder.update(id, updateData);
      return order ? new OrderAdapter(order) : null;
    }
  }

  static async delete(id) {
    if (DB_TYPE === 'mongodb') {
      await OrderModel.findByIdAndDelete(id);
      return true;
    } else {
      return await FirebaseOrder.delete(id);
    }
  }

  static async getStatsByUserIdAndDate(userId, date) {
    if (DB_TYPE === 'mongodb') {
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
        if (order.distanceKm >= LONG_TRIP_THRESHOLD_KM) {
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
    } else {
      return await FirebaseOrder.getStatsByUserIdAndDate(userId, date);
    }
  }

  toJSON() {
    return { ...this };
  }
}

// ==================== WorkTime Adapter ====================
class WorkTimeAdapter {
  constructor(data) {
    if (DB_TYPE === 'mongodb') {
      if (data._id) {
        this.id = data._id.toString();
        this.userId = data.userId;
        this.date = data.date;
        this.startTime = data.startTime || '';
        this.endTime = data.endTime || '';
        this.workHours = data.workHours || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
      } else {
        Object.assign(this, data);
      }
    } else {
      const fbWorkTime = new FirebaseWorkTime(data);
      Object.assign(this, fbWorkTime);
    }
  }

  async save() {
    if (DB_TYPE === 'mongodb') {
      const existing = await WorkTimeModel.findOne({
        userId: this.userId,
        date: this.date
      });

      if (existing) {
        // 更新
        const updated = await WorkTimeModel.findByIdAndUpdate(
          existing._id,
          {
            startTime: this.startTime,
            endTime: this.endTime,
            workHours: this.workHours
          },
          { new: true }
        );
        this.id = updated._id.toString();
        this.createdAt = updated.createdAt;
        this.updatedAt = updated.updatedAt;
      } else {
        // 创建
        const newWorkTime = await WorkTimeModel.create({
          userId: this.userId,
          date: this.date,
          startTime: this.startTime,
          endTime: this.endTime,
          workHours: this.workHours
        });
        this.id = newWorkTime._id.toString();
        this.createdAt = newWorkTime.createdAt;
        this.updatedAt = newWorkTime.updatedAt;
      }
    } else {
      const fbWorkTime = new FirebaseWorkTime(this);
      await fbWorkTime.save();
      Object.assign(this, fbWorkTime);
    }
    return this;
  }

  static async findByUserIdAndDate(userId, date) {
    if (DB_TYPE === 'mongodb') {
      const workTime = await WorkTimeModel.findOne({ userId, date });
      return workTime ? new WorkTimeAdapter(workTime) : null;
    } else {
      const workTime = await FirebaseWorkTime.findByUserIdAndDate(userId, date);
      return workTime ? new WorkTimeAdapter(workTime) : null;
    }
  }

  static async findByUserId(userId) {
    if (DB_TYPE === 'mongodb') {
      const workTimes = await WorkTimeModel.find({ userId })
        .sort({ date: -1 });
      return workTimes.map(wt => new WorkTimeAdapter(wt));
    } else {
      const workTimes = await FirebaseWorkTime.findByUserId(userId);
      return workTimes.map(wt => new WorkTimeAdapter(wt));
    }
  }

  toJSON() {
    return { ...this };
  }
}

// 导出适配器
// ==================== Dual-Write Adapters ====================
// When DB_DUAL_WRITE=true, write to both backends and read from READ_PRIMARY
class DualUser {
  constructor(data) {
    Object.assign(this, data);
  }

  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async save() {
    await this.hashPassword();
    // Write to primary first
    let primaryUser = null;
    if (READ_PRIMARY === 'mongodb') {
      if (this.id) {
        const updated = await UserModel.findByIdAndUpdate(
          this.id,
          { username: this.username, email: this.email, password: this.password, role: this.role },
          { new: true }
        );
        if (updated) primaryUser = updated;
      } else {
        const created = await UserModel.create({ username: this.username, email: this.email, password: this.password, role: this.role });
        primaryUser = created;
        this.id = created._id.toString();
      }
    } else {
      const fbUser = new FirebaseUser(this);
      await fbUser.save();
      primaryUser = fbUser;
      this.id = fbUser.id;
    }

    // Best-effort write to secondary
    try {
      if (READ_PRIMARY === 'mongodb') {
        // Secondary is Firebase - check if exists first
        const existingFbUser = await FirebaseUser.findByEmail(this.email);
        if (existingFbUser) {
          // Update existing Firebase user
          const fbUser = new FirebaseUser({ ...this, id: existingFbUser.id });
          await fbUser.save();
        } else {
          // Create new Firebase user (don't pass MongoDB id)
          const fbUser = new FirebaseUser({ 
            username: this.username, 
            email: this.email, 
            password: this.password, 
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
          });
          await fbUser.save();
        }
      } else {
        // Secondary is MongoDB
        const existing = await UserModel.findOne({ email: this.email });
        if (existing) {
          await UserModel.findByIdAndUpdate(existing._id, { username: this.username, email: this.email, password: this.password, role: this.role }, { new: true });
        } else {
          await UserModel.create({ username: this.username, email: this.email, password: this.password, role: this.role });
        }
      }
    } catch (e) {
      console.warn('⚠️ Dual-write (User) secondary write failed:', e.message);
    }

    return this;
  }

  static async findById(id) {
    if (READ_PRIMARY === 'mongodb') {
      const user = await UserModel.findById(id);
      return user ? new DualUser({ id: user._id.toString(), ...user.toObject() }) : null;
    } else {
      const user = await FirebaseUser.findById(id);
      return user ? new DualUser(user) : null;
    }
  }

  static async findByEmail(email) {
    if (READ_PRIMARY === 'mongodb') {
      const user = await UserModel.findOne({ email });
      return user ? new DualUser({ id: user._id.toString(), ...user.toObject() }) : null;
    } else {
      const user = await FirebaseUser.findByEmail(email);
      return user ? new DualUser(user) : null;
    }
  }

  static async findByUsername(username) {
    if (READ_PRIMARY === 'mongodb') {
      const user = await UserModel.findOne({ username });
      return user ? new DualUser({ id: user._id.toString(), ...user.toObject() }) : null;
    } else {
      const user = await FirebaseUser.findByUsername(username);
      return user ? new DualUser(user) : null;
    }
  }

  static async findByEmailOrUsername(email, username) {
    const emailUser = await this.findByEmail(email);
    if (emailUser) return emailUser;
    return await this.findByUsername(username);
  }

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}

class DualOrder {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    // Write to primary
    if (!this.date) this.date = new Date().toISOString().split('T')[0];
    console.log(`💾 DualOrder.save() - userId: ${this.userId}, date: ${this.date}, orderNumber: "${this.orderNumber}"`);
    if (READ_PRIMARY === 'mongodb') {
      if (this.id) {
        const updated = await OrderModel.findByIdAndUpdate(
          this.id,
          {
            userId: this.userId,
            date: this.date,
            orderNumber: this.orderNumber,
            paymentType: this.paymentType,
            orderValue: this.orderValue,
            paymentAmount: this.paymentAmount,
            changeReturned: this.changeReturned,
            extraCashTip: this.extraCashTip,
            distanceKm: this.distanceKm,
            notes: this.notes
          },
          { new: true }
        );
        if (updated) this.id = updated._id.toString();
      } else {
        const created = await OrderModel.create({
          userId: this.userId,
          date: this.date,
          orderNumber: this.orderNumber,
          paymentType: this.paymentType,
          orderValue: this.orderValue,
          paymentAmount: this.paymentAmount,
          changeReturned: this.changeReturned,
          extraCashTip: this.extraCashTip,
          distanceKm: this.distanceKm,
          notes: this.notes
        });
        this.id = created._id.toString();
      }
    } else {
      const fbOrder = new FirebaseOrder(this);
      await fbOrder.save();
      this.id = fbOrder.id;
    }

    // Best-effort write to secondary
    try {
      if (READ_PRIMARY === 'mongodb') {
        // Secondary is Firebase - create new order without MongoDB id
        console.log(`   📤 Writing to Firebase secondary...`);
        const fbOrder = new FirebaseOrder({
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
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        });
        await fbOrder.save();
        console.log(`   ✅ Firebase write successful, FB ID: ${fbOrder.id}`);
      } else {
        // Secondary MongoDB: try upsert by unique composite
        const existing = await OrderModel.findOne({ userId: this.userId, date: this.date, orderNumber: this.orderNumber });
        if (existing) {
          await OrderModel.findByIdAndUpdate(existing._id, {
            paymentType: this.paymentType,
            orderValue: this.orderValue,
            paymentAmount: this.paymentAmount,
            changeReturned: this.changeReturned,
            extraCashTip: this.extraCashTip,
            distanceKm: this.distanceKm,
            notes: this.notes
          }, { new: true });
        } else {
          await OrderModel.create({
            userId: this.userId,
            date: this.date,
            orderNumber: this.orderNumber,
            paymentType: this.paymentType,
            orderValue: this.orderValue,
            paymentAmount: this.paymentAmount,
            changeReturned: this.changeReturned,
            extraCashTip: this.extraCashTip,
            distanceKm: this.distanceKm,
            notes: this.notes
          });
        }
      }
    } catch (e) {
      console.warn('⚠️ Dual-write (Order) secondary write failed:', e.message);
    }

    return this;
  }

  static async findById(id) {
    if (READ_PRIMARY === 'mongodb') {
      const doc = await OrderModel.findById(id);
      return doc ? new DualOrder({ id: doc._id.toString(), ...doc.toObject() }) : null;
    } else {
      const order = await FirebaseOrder.findById(id);
      return order ? new DualOrder(order) : null;
    }
  }

  static async findByUserId(userId, sortBy = 'date', order = 'desc') {
    if (READ_PRIMARY === 'mongodb') {
      const sortOrder = order === 'desc' ? -1 : 1;
      const orders = await OrderModel.find({ userId }).sort({ [sortBy]: sortOrder });
      return orders.map(o => new DualOrder({ id: o._id.toString(), ...o.toObject() }));
    } else {
      const orders = await FirebaseOrder.findByUserId(userId, sortBy, order);
      return orders.map(o => new DualOrder(o));
    }
  }

  static async findByUserIdAndDateRange(userId, startDate, endDate) {
    if (READ_PRIMARY === 'mongodb') {
      const orders = await OrderModel.find({ userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: -1 });
      return orders.map(o => new DualOrder({ id: o._id.toString(), ...o.toObject() }));
    } else {
      const orders = await FirebaseOrder.findByUserIdAndDateRange(userId, startDate, endDate);
      return orders.map(o => new DualOrder(o));
    }
  }

  static async findByUserIdAndDate(userId, date) {
    if (READ_PRIMARY === 'mongodb') {
      const orders = await OrderModel.find({ userId, date });
      return orders.map(o => new DualOrder({ id: o._id.toString(), ...o.toObject() }));
    } else {
      const orders = await FirebaseOrder.findByUserIdAndDate(userId, date);
      return orders.map(o => new DualOrder(o));
    }
  }

  static async update(id, updateData) {
    let updated = null;
    if (READ_PRIMARY === 'mongodb') {
      const doc = await OrderModel.findByIdAndUpdate(id, updateData, { new: true });
      updated = doc ? new DualOrder({ id: doc._id.toString(), ...doc.toObject() }) : null;
    } else {
      updated = await FirebaseOrder.update(id, updateData);
      updated = updated ? new DualOrder(updated) : null;
    }

    // Best-effort secondary update
    try {
      if (updated) {
        if (READ_PRIMARY === 'mongodb') {
          // Secondary Firebase - find and update existing order, don't create new!
          console.log(`   🔍 Looking for Firebase order to update: userId=${updated.userId}, date=${updated.date}, orderNumber=${updated.orderNumber}`);
          
          const existingOrders = await FirebaseOrder.findByUserIdAndDate(updated.userId, updated.date);
          const existingOrder = existingOrders.find(o => 
            String(o.orderNumber).trim() === String(updated.orderNumber).trim()
          );
          
          if (existingOrder) {
            console.log(`   📝 Updating existing Firebase order: ${existingOrder.id}`);
            await FirebaseOrder.update(existingOrder.id, updateData);
          } else {
            console.log(`   ⚠️ No existing Firebase order found for update, skipping secondary write`);
          }
        } else {
          // Try to locate secondary doc by composite keys
          const candidate = await OrderModel.findOne({ userId: updated.userId, date: updated.date, orderNumber: updated.orderNumber });
          if (candidate) {
            await OrderModel.findByIdAndUpdate(candidate._id, updateData, { new: true });
          } else {
            await OrderModel.create({
              userId: updated.userId,
              date: updated.date,
              orderNumber: updated.orderNumber,
              paymentType: updated.paymentType,
              orderValue: updated.orderValue,
              paymentAmount: updated.paymentAmount,
              changeReturned: updated.changeReturned,
              extraCashTip: updated.extraCashTip,
              distanceKm: updated.distanceKm,
              notes: updated.notes
            });
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Dual-write (Order) secondary update failed:', e.message);
    }

    return updated;
  }

  static async delete(id) {
    // Delete primary first
    let primaryDoc = null;
    if (READ_PRIMARY === 'mongodb') {
      primaryDoc = await OrderModel.findById(id);
      await OrderModel.findByIdAndDelete(id);
    } else {
      primaryDoc = await FirebaseOrder.findById(id);
      await FirebaseOrder.delete(id);
    }

    // Best-effort delete on secondary
    try {
      if (READ_PRIMARY === 'mongodb') {
        if (primaryDoc) {
          console.log(`🗑️ Deleting Firebase order: userId=${primaryDoc.userId}, date=${primaryDoc.date}, orderNumber="${primaryDoc.orderNumber}"`);
          // Find Firebase order by composite keys (userId, date, orderNumber)
          const fbOrders = await FirebaseOrder.findByUserIdAndDate(primaryDoc.userId, primaryDoc.date);
          console.log(`   Found ${fbOrders.length} Firebase orders on ${primaryDoc.date}`);
          const matchingOrder = fbOrders.find(o => String(o.orderNumber).trim() === String(primaryDoc.orderNumber).trim());
          if (matchingOrder && matchingOrder.id) {
            console.log(`   Matched Firebase order ID: ${matchingOrder.id}`);
            await FirebaseOrder.delete(matchingOrder.id);
            console.log(`   ✅ Firebase order deleted successfully`);
          } else {
            console.log(`   ⚠️ No matching Firebase order found. Available orderNumbers:`, fbOrders.map(o => `"${o.orderNumber}"`));
          }
        }
      } else {
        if (primaryDoc) {
          const candidate = await OrderModel.findOne({ userId: primaryDoc.userId, date: primaryDoc.date, orderNumber: primaryDoc.orderNumber });
          if (candidate) await OrderModel.findByIdAndDelete(candidate._id);
        }
      }
    } catch (e) {
      console.warn('⚠️ Dual-write (Order) secondary delete failed:', e.message);
    }

    return true;
  }

  static async getStatsByUserIdAndDate(userId, date) {
    if (READ_PRIMARY === 'mongodb') {
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
        if (order.distanceKm >= LONG_TRIP_THRESHOLD_KM) {
          fuelFee += LONG_TRIP_EXTRA_FUEL;
          effectiveTrips += 2;
        } else {
          effectiveTrips += 1;
        }
        totalDistance += order.distanceKm * 2;
        totalTips += tipsTotal;
        fuelFeeTotal += fuelFee;
      });

      return { actualTrips: orders.length, effectiveTrips, totalDistance, fuelFeeTotal, totalTips };
    } else {
      return await FirebaseOrder.getStatsByUserIdAndDate(userId, date);
    }
  }

  toJSON() { return { ...this }; }
}

class DualWorkTime {
  constructor(data) { Object.assign(this, data); }

  async save() {
    // Primary write
    if (READ_PRIMARY === 'mongodb') {
      const existing = await WorkTimeModel.findOne({ userId: this.userId, date: this.date });
      if (existing) {
        const updated = await WorkTimeModel.findByIdAndUpdate(existing._id, { startTime: this.startTime, endTime: this.endTime, workHours: this.workHours }, { new: true });
        this.id = updated._id.toString();
      } else {
        const created = await WorkTimeModel.create({ userId: this.userId, date: this.date, startTime: this.startTime, endTime: this.endTime, workHours: this.workHours });
        this.id = created._id.toString();
      }
    } else {
      const fb = new FirebaseWorkTime(this);
      await fb.save();
      this.id = fb.id;
    }

    // Secondary write best-effort
    try {
      if (READ_PRIMARY === 'mongodb') {
        // Secondary Firebase - create/update without MongoDB id
        const fb = new FirebaseWorkTime({
          userId: this.userId,
          date: this.date,
          startTime: this.startTime,
          endTime: this.endTime,
          workHours: this.workHours,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt
        });
        await fb.save();
      } else {
        const existing = await WorkTimeModel.findOne({ userId: this.userId, date: this.date });
        if (existing) {
          await WorkTimeModel.findByIdAndUpdate(existing._id, { startTime: this.startTime, endTime: this.endTime, workHours: this.workHours }, { new: true });
        } else {
          await WorkTimeModel.create({ userId: this.userId, date: this.date, startTime: this.startTime, endTime: this.endTime, workHours: this.workHours });
        }
      }
    } catch (e) {
      console.warn('⚠️ Dual-write (WorkTime) secondary write failed:', e.message);
    }

    return this;
  }

  static async findByUserIdAndDate(userId, date) {
    if (READ_PRIMARY === 'mongodb') {
      const doc = await WorkTimeModel.findOne({ userId, date });
      return doc ? new DualWorkTime({ id: doc._id.toString(), ...doc.toObject() }) : null;
    } else {
      const wt = await FirebaseWorkTime.findByUserIdAndDate(userId, date);
      return wt ? new DualWorkTime(wt) : null;
    }
  }

  static async findByUserId(userId) {
    if (READ_PRIMARY === 'mongodb') {
      const docs = await WorkTimeModel.find({ userId }).sort({ date: -1 });
      return docs.map(d => new DualWorkTime({ id: d._id.toString(), ...d.toObject() }));
    } else {
      const list = await FirebaseWorkTime.findByUserId(userId);
      return list.map(w => new DualWorkTime(w));
    }
  }

  toJSON() { return { ...this }; }
}

export const User = DUAL ? DualUser : UserAdapter;
export const Order = DUAL ? DualOrder : OrderAdapter;
export const WorkTime = DUAL ? DualWorkTime : WorkTimeAdapter;
