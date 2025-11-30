# Render 部署快速指南

## 🎯 部署前准备清单

### ✅ 已完成
- [x] 代码已推送到 GitHub
- [x] 敏感文件已从历史中移除
- [x] `.gitignore` 已配置
- [x] `render.yaml` 配置文件已创建
- [x] 环境变量配置文件已准备

### 📋 待完成
- [ ] 准备 MongoDB Atlas 数据库
- [ ] 在 Render 部署后端服务
- [ ] 在 Render 部署前端服务
- [ ] 配置环境变量
- [ ] 测试应用功能

---

## 第一步：准备 MongoDB Atlas（5分钟）

### 1. 创建账号并登录
访问: https://www.mongodb.com/cloud/atlas/register

### 2. 创建免费集群
1. 点击 "Build a Database"
2. 选择 **FREE** (M0 Sandbox)
3. Cloud Provider: **AWS**
4. Region: 选择离你最近的（如 **Oregon (us-west-2)**）
5. Cluster Name: `TripWage`
6. 点击 "Create"

### 3. 配置数据库访问
**创建数据库用户**：
1. 左侧菜单 → Database Access → Add New Database User
2. Authentication Method: Password
3. Username: `tripwage_admin`
4. Password: **生成强密码并保存**（例如：`Abc123456!@#`）
5. Database User Privileges: Atlas admin
6. Add User

**配置网络访问**：
1. 左侧菜单 → Network Access → Add IP Address
2. 选择 "ALLOW ACCESS FROM ANYWHERE"
3. IP Address: `0.0.0.0/0`
4. 点击 "Confirm"

### 4. 获取连接字符串
1. 左侧菜单 → Database → Connect
2. 选择 "Drivers"
3. Driver: Node.js, Version: 4.1 or later
4. 复制连接字符串，格式如下：
   ```
   mongodb+srv://tripwage_admin:<password>@tripwage.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. 替换 `<password>` 为你的实际密码
6. 在末尾添加数据库名 `/tripwage`，最终格式：
   ```
   mongodb+srv://tripwage_admin:Abc123456!@#@tripwage.xxxxx.mongodb.net/tripwage?retryWrites=true&w=majority
   ```

**保存这个连接字符串，稍后在 Render 中使用！**

---

## 第二步：部署后端到 Render（10分钟）

### 1. 登录 Render
访问: https://dashboard.render.com/
- 使用 GitHub 账号登录

### 2. 创建 Web Service（后端）
1. 点击右上角 **"New +"** → **"Web Service"**
2. 连接 GitHub 仓库：
   - 点击 "Configure account" 授权 Render 访问你的 GitHub
   - 找到并选择 `jianglei919/Trip_Wage` 仓库
   - 点击 "Connect"

### 3. 配置后端服务
填写以下信息：

**Basic Settings:**
- **Name**: `trip-wage-api`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- 选择 **Free** ($0/month)

### 4. 设置环境变量
点击 "Advanced" → "Add Environment Variable"，添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 环境标识 |
| `PORT` | `10000` | 端口（Render自动设置） |
| `DB_TYPE` | `mongodb` | 数据库类型 |
| `DB_DUAL_WRITE` | `false` | 关闭双写 |
| `READ_PRIMARY` | `mongodb` | 主数据库 |
| `JWT_SECRET` | 点击 "Generate" 按钮 | JWT密钥（自动生成） |
| `MONGODB_URL` | `mongodb+srv://...` | 粘贴你的MongoDB连接字符串 |
| `CORS_ORIGIN` | `https://trip-wage-frontend.onrender.com` | 暂时填这个，稍后更新 |

### 5. 创建服务
1. 点击底部 **"Create Web Service"**
2. 等待部署（大约 3-5 分钟）
3. 部署成功后，记录后端 URL，例如：
   ```
   https://trip-wage-api.onrender.com
   ```

### 6. 测试后端
在浏览器访问：
```
https://trip-wage-api.onrender.com/api/health
```
如果看到 JSON 响应，说明后端部署成功！

---

## 第三步：部署前端到 Render（10分钟）

### 1. 创建 Static Site（前端）
1. 回到 Render Dashboard
2. 点击 **"New +"** → **"Static Site"**
3. 选择 `jianglei919/Trip_Wage` 仓库
4. 点击 "Connect"

### 2. 配置前端服务
填写以下信息：

**Basic Settings:**
- **Name**: `trip-wage-frontend`
- **Branch**: `main`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

### 3. 设置环境变量
点击 "Advanced" → "Add Environment Variable"：

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://trip-wage-api.onrender.com/api` |

**重要**: 使用第二步中记录的实际后端 URL！

### 4. 创建服务
1. 点击 **"Create Static Site"**
2. 等待部署（大约 3-5 分钟）
3. 部署成功后，记录前端 URL，例如：
   ```
   https://trip-wage-frontend.onrender.com
   ```

---

## 第四步：更新 CORS 配置（2分钟）

前端部署完成后，需要更新后端的 CORS 设置：

1. 回到 Render Dashboard
2. 选择 `trip-wage-api` 服务
3. 左侧菜单 → **Environment**
4. 找到 `CORS_ORIGIN` 变量
5. 更新为实际的前端 URL：
   ```
   https://trip-wage-frontend.onrender.com
   ```
6. 点击 **"Save Changes"**
7. 服务会自动重新部署（约 1-2 分钟）

---

## 第五步：测试应用（5分钟）

### 1. 访问前端
在浏览器打开你的前端 URL：
```
https://trip-wage-frontend.onrender.com
```

### 2. 测试注册功能
1. 点击 "Register"
2. 填写用户名、邮箱、密码
3. 提交注册
4. 如果成功，会跳转到 Trip Wage 页面

### 3. 测试订单功能
1. 点击 "Add Order"
2. 填写订单信息
3. 保存订单
4. 检查是否在列表中显示

### 4. 检查 MongoDB 数据
1. 回到 MongoDB Atlas
2. Database → Browse Collections
3. 应该能看到 `tripwage` 数据库
4. 查看 `users` 和 `orders` 集合中的数据

---

## 🎉 部署完成！

你的应用现在已经在线运行了：
- **前端**: https://trip-wage-frontend.onrender.com
- **后端**: https://trip-wage-api.onrender.com
- **数据库**: MongoDB Atlas 云端

---

## ⚠️ Free Tier 重要提醒

### 自动休眠
- **15 分钟**无请求后，服务会自动休眠
- 下次访问需要 **30-50 秒**冷启动
- 用户可能会看到加载延迟

### 避免休眠的方法
1. **升级到付费版**（$7/月）- 推荐
2. 使用 Uptime Monitor（如 UptimeRobot）每 10 分钟 ping 一次
   - ⚠️ 可能违反 Render TOS，不推荐

### 每月限制
- **750 小时** 免费实例运行时间
- 超过后服务会停止（直到下个月）

---

## 📊 监控和维护

### 查看日志
1. Render Dashboard → 选择服务
2. 左侧菜单 → **Logs**
3. 查看实时日志和错误信息

### 查看指标
1. Render Dashboard → 选择服务
2. 左侧菜单 → **Metrics**
3. 查看 CPU、内存、请求数等

### 手动部署
1. Render Dashboard → 选择服务
2. 右上角 → **Manual Deploy** → **Deploy latest commit**

### 自动部署
- 推送到 `main` 分支会自动触发部署
- 可以在 Settings → Build & Deploy 中配置

---

## 🔧 常见问题

### 1. 后端返回 500 错误
**检查**:
- Render Logs 查看错误详情
- 确认 `MONGODB_URL` 正确
- 确认 MongoDB Network Access 允许 `0.0.0.0/0`

### 2. 前端无法连接后端（CORS 错误）
**解决**:
- 确认 `CORS_ORIGIN` 设置为正确的前端 URL
- 重新部署后端服务

### 3. 数据库连接超时
**解决**:
- 检查 MongoDB Atlas 的 Network Access
- 确认连接字符串包含数据库名 `/tripwage`
- 检查用户名密码是否正确

### 4. 首次访问很慢
**原因**: Free tier 服务休眠后需要冷启动
**解决**: 耐心等待 30-50 秒，或升级到付费版

---

## 📝 下一步优化建议

1. **自定义域名**（可选）
   - 在 Render 中添加自定义域名
   - 更新 DNS 记录

2. **启用 HTTPS**（默认已启用）
   - Render 自动提供 SSL 证书

3. **添加监控**
   - 设置 Uptime Monitor
   - 配置错误告警

4. **数据备份**
   - MongoDB Atlas 自动备份（付费版）
   - 或定期导出数据

---

## 🎓 学习资源

- Render 文档: https://render.com/docs
- MongoDB Atlas 文档: https://docs.atlas.mongodb.com
- Render 社区: https://community.render.com

---

祝你部署顺利！🚀
