import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  }
}, {
  timestamps: true,
  collection: 'users'
});

// 创建索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
