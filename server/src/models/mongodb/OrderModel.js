import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    default: ''
  },
  paymentType: {
    type: String,
    default: 'online',
    enum: ['online', 'cash', 'card', 'mixed']
  },
  orderValue: {
    type: Number,
    default: 0
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  changeReturned: {
    type: Number,
    default: 0
  },
  extraCashTip: {
    type: Number,
    default: 0
  },
  distanceKm: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'orders'
});

// 创建复合索引用于优化查询
orderSchema.index({ userId: 1, date: -1 });
orderSchema.index({ userId: 1, date: 1 });

const OrderModel = mongoose.model('Order', orderSchema);

export default OrderModel;
