# MongoDB 集成完成 ✅

## 🎉 已完成的功能

1. ✅ MongoDB 配置和连接
2. ✅ 数据库适配器层（支持 Firebase 和 MongoDB 无缝切换）
3. ✅ MongoDB Schema 模型（User, Order, WorkTime）
4. ✅ 自动根据 DB_TYPE 初始化对应数据库
5. ✅ 所有 API 保持兼容，无需修改前端代码

## 🚀 快速开始

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置数据库

编辑 `server/.env`：

```env
# 选择数据库类型
DB_TYPE=mongodb

# MongoDB 配置（二选一）
# 云端 MongoDB Atlas
MONGODB_URL=mongodb+srv://leighton:qwerty123456@cluster0.3vvnl.mongodb.net/tripwage

# 本地 MongoDB
# MONGODB_URL=mongodb://root:123456@localhost:27017/tripwage?authSource=admin
```

### 3. 测试 MongoDB 连接
```bash
npm run test:mongodb
```

### 4. 切换数据库（可选）

使用便捷脚本：
```bash
# 切换到 MongoDB
npm run switch-db mongodb

# 切换到 Firebase
npm run switch-db firebase
```

或手动编辑 `.env` 文件修改 `DB_TYPE`。

### 5. 启动服务器
```bash
npm run dev
```

启动时会显示：
```
🚀 Initializing database: MONGODB
✅ MongoDB connected successfully
🔧 Database adapter initialized with: MONGODB
```

## 📋 使用方法

### 方式一：环境变量切换（推荐）

```env
# 使用 MongoDB
DB_TYPE=mongodb

# 使用 Firebase
DB_TYPE=firebase
```

### 方式二：快捷命令切换

```bash
npm run switch-db mongodb  # 切换到 MongoDB
npm run switch-db firebase # 切换到 Firebase
```

## 🔍 验证切换是否成功

1. 检查启动日志
2. 查看数据库连接信息
3. 测试 API 端点（登录、创建订单等）

## 📊 数据库对比

| 特性 | Firebase | MongoDB |
|------|----------|---------|
| 实时同步 | ✅ 优秀 | ⚠️ 需配置 |
| 查询性能 | ⚠️ 中等 | ✅ 优秀 |
| 复杂查询 | ⚠️ 有限 | ✅ 强大 |
| 扩展性 | ✅ 自动 | ✅ 灵活 |
| 成本 | 💰 按用量 | 💰 固定 |
| 本地开发 | ⚠️ 需模拟器 | ✅ 原生支持 |

## 🎯 数据模型

三个核心集合：

1. **users** - 用户信息
2. **orders** - 订单记录
3. **workTimes** - 工作时间

所有集合在两个数据库中结构完全一致。

## ⚠️ 注意事项

### MongoDB 本地开发
```bash
# macOS - 启动 MongoDB
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=123456 \
  mongo:latest
```

### MongoDB Atlas（云端）
- 确保 IP 白名单已配置（0.0.0.0/0 允许所有）
- 检查用户权限
- 验证数据库名称

### 安全建议
- 不要将数据库密码提交到 Git
- 使用强密码
- 生产环境使用环境变量
- 定期备份数据

## 🐛 故障排查

### 连接失败
```bash
# 测试 MongoDB 连接
npm run test:mongodb

# 检查 MongoDB 服务状态
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod
```

### 常见错误

1. **MongooseServerSelectionError**
   - 检查 MongoDB 是否运行
   - 验证连接字符串
   - 检查网络和防火墙

2. **Authentication failed**
   - 检查用户名密码
   - 确认 authSource 设置

3. **Collection not found**
   - 首次使用会自动创建
   - 无需手动创建集合

## 📝 API 端点（保持不变）

无论使用哪个数据库，所有 API 端点行为完全一致：

```
POST   /api/users/register      - 注册
POST   /api/users/login         - 登录
GET    /api/orders              - 获取订单列表
POST   /api/orders              - 创建订单
PUT    /api/orders/:id          - 更新订单
DELETE /api/orders/:id          - 删除订单
GET    /api/orders/date/:date   - 按日期查询
GET    /api/orders/historical-stats - 历史统计
```

## 🎁 额外功能

- 自动索引优化
- 统一的错误处理
- 数据验证
- 时间戳自动管理

---

需要帮助？查看 `DATABASE_CONFIG.md` 获取更多详细信息。
