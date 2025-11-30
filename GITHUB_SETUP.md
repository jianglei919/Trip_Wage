# GitHub 仓库设置指南

## 📝 步骤 1: 在 GitHub 创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 `+` → `New repository`
3. 填写仓库信息：
   - **Repository name**: `Trip_Wage`（或你喜欢的名字）
   - **Description**: "Delivery driver accounting system - Full stack app for tracking orders and income"
   - **Visibility**: 选择 `Public`（如果要部署到 Render 免费版）或 `Private`
   - ⚠️ **不要勾选** "Add a README file"（我们已经有了）
   - ⚠️ **不要勾选** "Add .gitignore"（我们已经配置了）
   - ⚠️ **不要勾选** "Choose a license"（可以之后添加）
4. 点击 `Create repository`

## 📝 步骤 2: 连接本地仓库到 GitHub

创建仓库后，GitHub 会显示快速设置页面。选择 **"...or push an existing repository from the command line"** 部分的命令。

在你的终端运行：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/Trip_Wage.git

# 推送代码到 GitHub
git push -u origin main
```

### 如果使用 SSH（推荐）：

```bash
# 添加远程仓库（SSH 方式）
git remote add origin git@github.com:YOUR_USERNAME/Trip_Wage.git

# 推送代码
git push -u origin main
```

## 🔐 步骤 3: 配置 Git 凭证（如果需要）

### HTTPS 方式（需要 Personal Access Token）

1. 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击 `Generate new token (classic)`
3. 选择 scopes:
   - ✅ `repo` (完整仓库控制)
4. 生成并复制 token
5. 第一次 push 时使用 token 作为密码

### SSH 方式（推荐，更安全）

```bash
# 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥到剪贴板（macOS）
cat ~/.ssh/id_ed25519.pub | pbcopy

# 在 GitHub 添加 SSH key:
# Settings → SSH and GPG keys → New SSH key
# 粘贴公钥并保存
```

## ✅ 步骤 4: 验证推送成功

```bash
# 推送代码
git push -u origin main

# 查看远程分支
git remote -v
```

成功后你会看到：
```
origin  https://github.com/YOUR_USERNAME/Trip_Wage.git (fetch)
origin  https://github.com/YOUR_USERNAME/Trip_Wage.git (push)
```

## 📋 步骤 5: 检查 GitHub 仓库

访问 `https://github.com/YOUR_USERNAME/Trip_Wage` 确认：
- ✅ 所有文件已上传
- ✅ README.md 正确显示
- ✅ DEPLOY.md 可以访问
- ⚠️ **确认** `.env` 文件和 `serviceAccountKey.json` **没有**被上传

## 🚀 下一步：部署到 Render

代码推送成功后：

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 连接你的 GitHub 账号
3. 按照 `DEPLOY.md` 的指南部署后端和前端
4. 配置环境变量（MongoDB URL、JWT Secret 等）

## ❓ 常见问题

### 问题 1: 推送被拒绝（403 Forbidden）
**原因**: GitHub 不再支持密码认证
**解决**: 使用 Personal Access Token 或 SSH key

### 问题 2: 推送时要求用户名密码
**原因**: 使用了 HTTPS URL
**解决**: 
```bash
# 切换到 SSH
git remote set-url origin git@github.com:YOUR_USERNAME/Trip_Wage.git
```

### 问题 3: 敏感文件被推送到 GitHub
**解决**: 
```bash
# 从 Git 历史中删除敏感文件
git rm --cached server/serviceAccountKey.json
git rm --cached server/.env.production

# 提交删除
git commit -m "Remove sensitive files"
git push origin main
```

## 📞 需要帮助？

- GitHub 文档: https://docs.github.com
- Git 教程: https://git-scm.com/docs
