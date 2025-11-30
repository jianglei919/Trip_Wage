# Trip Wage - Render 部署指南

## 前置准备

1. **GitHub 代码仓库**
   - 确保代码已推送到 GitHub
   - 确认 `.gitignore` 已排除敏感文件

2. **MongoDB Atlas**
   - 创建云端 MongoDB 集群
   - 获取连接字符串（格式：`mongodb+srv://username:password@cluster.xxx.mongodb.net/tripwage`）
   - 在 Network Access 中添加 `0.0.0.0/0`（允许所有 IP，Render 使用动态 IP）

3. **Firebase 配置**（如果使用 Firebase）
   - 在 Firebase Console 下载 Service Account Key JSON
   - 记录 `project_id`, `client_email`, `private_key`

---

## 部署步骤

### 1. 部署后端 API

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库，选择 `Trip_Wage` 项目
4. 配置：
   - **Name**: `trip-wage-api`
   - **Region**: Oregon (或离你最近的区域)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. 添加环境变量（Environment Variables）：
   ```
   NODE_ENV=production
   PORT=10000
   DB_TYPE=mongodb
   DB_DUAL_WRITE=false
   READ_PRIMARY=mongodb
   JWT_SECRET=<点击 Generate 自动生成>
   MONGODB_URL=mongodb+srv://your-username:password@cluster.xxx.mongodb.net/tripwage
   CORS_ORIGIN=https://trip-wage.onrender.com
   ```

   如果使用 Firebase 双写，还需添加：
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

6. 点击 "Create Web Service"，等待部署完成
7. 记录后端 URL（例如：`https://trip-wage-api.onrender.com`）

---

### 2. 部署前端（静态站点）

1. 在 Render Dashboard，点击 "New +" → "Static Site"
2. 连接 GitHub 仓库，选择 `Trip_Wage` 项目
3. 配置：
   - **Name**: `trip-wage-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. 添加环境变量：
   ```
   REACT_APP_API_URL=https://trip-wage-api.onrender.com/api
   ```
   （使用步骤 1 中记录的后端 URL）

5. 点击 "Create Static Site"，等待部署完成
6. 记录前端 URL（例如：`https://trip-wage.onrender.com`）

---

### 3. 更新 CORS 配置

1. 回到后端服务的环境变量设置
2. 更新 `CORS_ORIGIN` 为实际的前端 URL：
   ```
   CORS_ORIGIN=https://trip-wage.onrender.com
   ```
3. 保存并触发重新部署

---

## 验证部署

1. **测试后端**：
   ```bash
   curl https://trip-wage-api.onrender.com/api/health
   ```

2. **测试前端**：
   - 访问 `https://trip-wage.onrender.com`
   - 尝试注册/登录
   - 添加订单测试

---

## 重要提醒

### Free Tier 限制
- **自动休眠**：15 分钟无请求后会休眠，下次访问需要等待 30-50 秒冷启动
- **每月 750 小时**：免费实例每月有 750 小时限制
- **内存限制**：512 MB RAM

### 敏感信息安全
- ✅ `.env` 文件已被 `.gitignore` 排除
- ✅ Firebase Service Account Key 不要提交到 GitHub
- ✅ MongoDB 连接字符串只在 Render 环境变量中配置
- ✅ JWT_SECRET 使用 Render 自动生成功能

### 数据库连接
- 确保 MongoDB Atlas 的 Network Access 允许 `0.0.0.0/0`
- Render 使用动态 IP，无法使用固定 IP 白名单

---

## 常见问题

### 1. 部署失败：找不到模块
**解决**：检查 `package.json` 的 dependencies，确保所有依赖都在 `dependencies`（而非 `devDependencies`）

### 2. 跨域错误（CORS）
**解决**：确保后端 `CORS_ORIGIN` 环境变量设置为前端实际 URL

### 3. 数据库连接超时
**解决**：
- 检查 MongoDB Atlas Network Access 是否允许 `0.0.0.0/0`
- 确认 `MONGODB_URL` 连接字符串正确
- 查看 Render 日志排查详细错误

### 4. 前端访问 API 404
**解决**：确保 `REACT_APP_API_URL` 包含 `/api` 后缀

---

## 本地开发 vs 生产环境

| 配置项 | 本地开发 | 生产环境（Render） |
|--------|----------|-------------------|
| 后端地址 | `http://localhost:5050` | `https://trip-wage-api.onrender.com` |
| 数据库 | 本地 MongoDB | MongoDB Atlas |
| 环境文件 | `.env.development` | Render 环境变量 |
| 启动方式 | `npm run dev` | `npm start` |

---

## 更新部署

### 自动部署
- 推送到 `main` 分支会自动触发 Render 重新部署

### 手动部署
1. 在 Render Dashboard 中找到对应服务
2. 点击 "Manual Deploy" → "Deploy latest commit"

---

## 监控与日志

- **查看日志**：Render Dashboard → 选择服务 → Logs
- **监控性能**：Render Dashboard → 选择服务 → Metrics
- **查看环境变量**：Render Dashboard → 选择服务 → Environment

---

## 成本优化建议

如果需要避免冷启动：
1. 升级到 Paid Plan（$7/月起）
2. 或使用 cron-job.org 每 10 分钟 ping 一次保持激活（不推荐，可能违反 TOS）

---

## 联系支持

- Render 文档：https://render.com/docs
- Render 社区：https://community.render.com
