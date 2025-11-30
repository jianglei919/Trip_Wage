# Trip Wage

A full-stack web application for tracking trips and earnings, built with React and Node.js.

## 项目结构

```
Trip_Wage/
├── client/          # React 前端应用
│   ├── public/      # 静态文件
│   └── src/
│       ├── components/   # React 组件
│       ├── context/      # Context API (状态管理)
│       ├── pages/        # 页面组件
│       ├── services/     # API 服务
│       ├── App.js
│       └── index.js
├── server/          # Node.js 后端应用
│   └── src/
│       ├── controllers/  # 控制器
│       ├── middleware/   # 中间件
│       ├── models/       # 数据模型
│       ├── routes/       # 路由
│       └── index.js
└── README.md
```

## 功能特性

- 🔐 用户认证 (注册/登录)
- 📊 仪表盘统计
- 🚗 行程管理 (增删改查)
- 💰 收入追踪
- 📈 统计分析

## 技术栈

### 前端
- React 18
- React Router v6
- Axios
- Context API

### 后端
- Node.js
- Express
- Firebase (Firestore)
- JWT 认证
- bcryptjs

## 快速开始

### 前置要求

- Node.js (v14 或更高版本)
- Firebase 项目 (需要在 Firebase Console 创建)

### 安装步骤

1. **克隆仓库**
   ```bash
   cd Trip_Wage
   ```

2. **安装后端依赖**
   ```bash
   cd server
   npm install
   ```

3. **配置后端环境变量**
   
   首先，在 [Firebase Console](https://console.firebase.google.com/) 创建项目：
   - 创建新项目或选择现有项目
   - 进入项目设置 > 服务账号
   - 生成新的私钥并下载 JSON 文件
   
   然后配置环境变量：
   ```bash
   cp .env.example .env
   ```
   
   **方式 1：使用服务账号文件（推荐）**
   - 将下载的 JSON 文件重命名为 `serviceAccountKey.json`
   - 放在 `server/` 目录下
   - 在 `.env` 中设置：
     ```
     FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
     JWT_SECRET=your_secret_key_here
     ```
   
   **方式 2：使用环境变量**
   - 编辑 `.env` 文件，从 JSON 文件中复制以下信息：
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     JWT_SECRET=your_secret_key_here
     ```

4. **安装前端依赖**
   ```bash
   cd ../client
   npm install
   ```

5. **配置前端环境变量**
   ```bash
   cp .env.example .env
   ```

### 运行应用

1. **启动后端服务器**
   ```bash
   cd server
   npm run dev
   ```
   服务器将在 http://localhost:5000 运行

2. **启动前端应用** (新终端窗口)
   ```bash
   cd client
   npm start
   ```
   应用将在 http://localhost:3000 打开

## API 端点

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息 (需要认证)

### 行程相关
- `GET /api/trips` - 获取所有行程 (需要认证)
- `POST /api/trips` - 创建新行程 (需要认证)
- `GET /api/trips/:id` - 获取单个行程 (需要认证)
- `PUT /api/trips/:id` - 更新行程 (需要认证)
- `DELETE /api/trips/:id` - 删除行程 (需要认证)
- `GET /api/trips/stats` - 获取统计数据 (需要认证)

## 开发命令

### 后端
- `npm start` - 启动生产服务器
- `npm run dev` - 启动开发服务器 (热重载)
- `npm test` - 运行测试

### 前端
- `npm start` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm test` - 运行测试

## 数据模型

### User (用户) - Firestore Collection
```javascript
{
  id: string (document ID),
  username: string,
  email: string,
  password: string (hashed),
  role: string (user/admin),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Trip (行程) - Firestore Collection
```javascript
{
  id: string (document ID),
  userId: string,
  origin: string,
  destination: string,
  distance: number,
  duration: number,
  fare: number,
  date: timestamp,
  status: string (pending/completed/cancelled),
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Firebase 配置说明

### 在 Firebase Console 中的设置

1. **创建 Firestore 数据库**
   - 在 Firebase Console 中选择 Firestore Database
   - 创建数据库（选择生产模式或测试模式）
   - 设置位置（建议选择离用户最近的区域）

2. **安全规则示例**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users collection
       match /users/{userId} {
         allow read: if request.auth != null;
         allow create: if true;
         allow update, delete: if request.auth.uid == userId;
       }
       
       // Trips collection
       match /trips/{tripId} {
         allow read, write: if request.auth != null && 
           resource.data.userId == request.auth.uid;
         allow create: if request.auth != null;
       }
     }
   }
   ```

   注意：以上规则仅为示例。在生产环境中，您需要根据实际需求调整安全规则。

## 贡献

欢迎提交 Pull Request 或创建 Issue！

## 许可证

ISC
