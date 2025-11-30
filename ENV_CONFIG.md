# 环境配置指南

## 📦 项目环境配置

本项目支持 **开发环境** 和 **生产环境** 的独立配置。

## 🏗️ 目录结构

```
Trip_Wage/
├── server/                    # 后端
│   ├── .env                   # 当前使用的配置（不提交到Git）
│   ├── .env.development       # 开发环境配置
│   ├── .env.production        # 生产环境配置
│   └── .env.example           # 配置示例文件
│
└── client/                    # 前端
    ├── .env.development       # 开发环境配置
    ├── .env.production        # 生产环境配置
    └── .env.example           # 配置示例文件
```

## 🚀 使用方法

### 后端（Server）

#### 开发环境
```bash
cd server
npm run dev                    # 使用默认配置
npm run dev:mongodb            # 强制使用 MongoDB
npm run dev:firebase           # 强制使用 Firebase
```

#### 生产环境
```bash
cd server
npm run prod                   # 使用生产配置
```

#### 手动指定环境
```bash
# 使用开发配置
NODE_ENV=development npm start

# 使用生产配置
NODE_ENV=production npm start
```

### 前端（Client）

#### 开发环境
```bash
cd client
npm install                    # 首次需要安装 env-cmd
npm start                      # 默认开发模式
npm run start:dev              # 明确指定开发环境
```

#### 生产构建
```bash
cd client
npm run build:prod             # 生产环境构建
npm run build:dev              # 开发环境构建（用于测试）
```

## ⚙️ 环境变量说明

### 后端环境变量

| 变量 | 开发环境 | 生产环境 | 说明 |
|------|---------|---------|------|
| `NODE_ENV` | development | production | 运行环境 |
| `PORT` | 5050 | 5050 | 服务端口 |
| `DB_TYPE` | firebase | mongodb | 数据库类型 |
| `MONGODB_URL` | 本地地址 | Atlas云端 | MongoDB连接 |
| `JWT_SECRET` | 测试密钥 | 强密码 | JWT加密 |
| `LOG_LEVEL` | debug | info | 日志级别 |
| `CORS_ORIGIN` | localhost:3000 | 生产域名 | CORS配置 |

### 前端环境变量

| 变量 | 开发环境 | 生产环境 | 说明 |
|------|---------|---------|------|
| `REACT_APP_ENV` | development | production | 环境标识 |
| `REACT_APP_API_URL` | localhost:5050 | 生产API | API地址 |
| `REACT_APP_DEBUG` | true | false | 调试模式 |
| `REACT_APP_API_TIMEOUT` | 10000 | 30000 | 超时时间(ms) |
| `GENERATE_SOURCEMAP` | - | false | 源码映射 |

## 🔧 配置优先级

环境变量加载优先级（从高到低）：

1. **命令行参数**：`NODE_ENV=production npm start`
2. **`.env.local`**：本地覆盖（不提交Git）
3. **`.env.development` / `.env.production`**：环境配置
4. **`.env`**：默认配置

## 📝 首次设置

### 1. 后端设置

```bash
cd server

# 复制示例文件
cp .env.example .env

# 编辑配置
nano .env  # 或使用你喜欢的编辑器

# 配置数据库
# 开发环境：使用本地 MongoDB 或 Firebase
# 生产环境：使用 MongoDB Atlas 或 Firebase
```

### 2. 前端设置

```bash
cd client

# 安装依赖（包含 env-cmd）
npm install

# 前端自动使用对应环境的配置文件
# 开发: .env.development
# 生产: .env.production
```

## 🔐 安全注意事项

### ⚠️ 不要提交的文件
- `.env`
- `.env.local`
- `serviceAccountKey.json`

### ✅ 可以提交的文件
- `.env.example`
- `.env.development` (去除敏感信息)
- `.env.production` (去除敏感信息)

### 🔒 生产环境最佳实践

1. **使用强密码**
   ```env
   JWT_SECRET=use_a_very_strong_random_password_here
   ```

2. **使用环境变量**（而非配置文件）
   ```bash
   # 部署平台（如 Heroku, Vercel）设置环境变量
   export JWT_SECRET="your-secret"
   export MONGODB_URL="mongodb+srv://..."
   ```

3. **限制 CORS**
   ```env
   CORS_ORIGIN=https://your-production-domain.com
   ```

4. **关闭调试**
   ```env
   LOG_LEVEL=info
   REACT_APP_DEBUG=false
   ```

## 🧪 测试环境配置

```bash
# 测试 MongoDB 连接
npm run test:mongodb

# 切换数据库
npm run switch-db mongodb
npm run switch-db firebase
```

## 🐛 常见问题

### Q: 修改环境变量后不生效？
**A:** 需要重启服务器
```bash
# 后端：重启 nodemon 或 npm run dev
# 前端：重启 npm start
```

### Q: 如何知道当前使用的是哪个环境？
**A:** 查看启动日志
```
🚀 Initializing database: MONGODB
Node Environment: development
```

### Q: 前端环境变量不生效？
**A:** 确保：
1. 变量以 `REACT_APP_` 开头
2. 已重启开发服务器
3. 使用 `process.env.REACT_APP_变量名` 访问

### Q: 如何在代码中获取环境？
**A:** 
```javascript
// 后端
const env = process.env.NODE_ENV;
const isDev = env === 'development';

// 前端
const env = process.env.REACT_APP_ENV;
const isDev = env === 'development';
```

## 📊 环境对比

| 特性 | 开发环境 | 生产环境 |
|------|---------|---------|
| 数据库 | 本地/测试 | 云端/正式 |
| 日志 | 详细调试 | 关键信息 |
| 源码映射 | 启用 | 禁用 |
| 缓存 | 禁用 | 启用 |
| 压缩 | 否 | 是 |
| 错误堆栈 | 完整 | 简化 |

## 🚢 部署检查清单

- [ ] 更新 `JWT_SECRET` 为强密码
- [ ] 配置生产数据库连接
- [ ] 设置正确的 `CORS_ORIGIN`
- [ ] 关闭调试模式
- [ ] 验证 API URL
- [ ] 测试构建：`npm run build:prod`
- [ ] 检查环境变量是否正确加载

---

需要帮助？查看 `DATABASE_CONFIG.md` 和 `MONGODB_SETUP.md`
