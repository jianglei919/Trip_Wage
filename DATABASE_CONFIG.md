# Trip Wage - 数据库配置说明

## 📦 支持的数据库

本项目支持两种数据库：
- **Firebase Firestore** (默认)
- **MongoDB**

## 🔧 配置方法

### 1. 安装依赖

```bash
cd server
npm install
```

这将自动安装 `mongoose` 以支持 MongoDB。

### 2. 配置环境变量

编辑 `server/.env` 文件：

```env
# 数据库选择: 'mongodb' 或 'firebase'
DB_TYPE=firebase

# MongoDB 配置（选择其中一个）
# 云端 MongoDB Atlas
MONGODB_URL=mongodb+srv://leighton:qwerty123456@cluster0.3vvnl.mongodb.net/tripwage

# 本地 MongoDB
# MONGODB_URL=mongodb://root:123456@localhost:27017/tripwage?authSource=admin

# Firebase 配置
FIREBASE_PROJECT_ID=tripwagedata
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### 3. 切换数据库

#### 使用 Firebase (默认)
```env
DB_TYPE=firebase
```

#### 使用 MongoDB
```env
DB_TYPE=mongodb
```

## 🚀 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

启动时会显示使用的数据库：
```
🚀 Initializing database: MONGODB
✅ MongoDB connected successfully
```

或

```
🚀 Initializing database: FIREBASE
✅ Firebase initialized successfully
```

## 📊 数据模型

无论使用哪个数据库，数据模型保持一致：

### User（用户）
- username: 用户名
- email: 邮箱
- password: 密码（加密）
- role: 角色（user/admin）

### Order（订单）
- userId: 用户ID
- date: 日期
- orderNumber: 订单号
- paymentType: 支付方式
- orderValue: 订单金额
- paymentAmount: 实付金额
- changeReturned: 找零
- extraCashTip: 额外现金小费
- distanceKm: 距离（公里）
- notes: 备注

### WorkTime（工作时间）
- userId: 用户ID
- date: 日期
- startTime: 开始时间
- endTime: 结束时间
- workHours: 工作时长

## 🔄 数据迁移

如需从 Firebase 迁移到 MongoDB 或反向迁移，可以：

1. 导出数据（通过 Excel 导出功能）
2. 切换 `DB_TYPE`
3. 手动导入数据或使用数据迁移脚本

## ⚠️ 注意事项

1. **MongoDB 本地开发**：确保 MongoDB 服务已启动
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **MongoDB Atlas**：确保网络白名单已配置

3. **Firebase**：确保 `serviceAccountKey.json` 文件存在

4. **性能**：MongoDB 更适合大数据量，Firebase 更适合实时同步

## 🔐 安全建议

- 生产环境中使用环境变量，不要硬编码数据库凭据
- MongoDB 使用强密码
- Firebase 使用服务账号密钥文件，不要提交到 Git
- 定期备份数据

## 📝 API 兼容性

所有 API 端点在两种数据库下行为一致，无需修改前端代码。

---

如有问题，请查看日志输出或联系开发团队。
