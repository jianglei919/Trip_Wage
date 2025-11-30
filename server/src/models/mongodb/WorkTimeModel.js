import mongoose from 'mongoose';

const workTimeSchema = new mongoose.Schema({
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
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  },
  workHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'workTimes'
});

// 创建唯一索引确保每个用户每天只有一条记录
workTimeSchema.index({ userId: 1, date: 1 }, { unique: true });

const WorkTimeModel = mongoose.model('WorkTime', workTimeSchema);

export default WorkTimeModel;
