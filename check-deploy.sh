#!/bin/bash

# 部署前检查脚本
echo "🔍 检查部署准备情况..."

# 检查敏感文件是否被排除
echo ""
echo "📋 检查 .gitignore..."
if grep -q "serviceAccountKey.json" .gitignore && grep -q ".env" .gitignore; then
    echo "✅ .gitignore 配置正确"
else
    echo "❌ .gitignore 缺少敏感文件配置"
    exit 1
fi

# 检查是否有未提交的敏感文件
echo ""
echo "🔒 检查是否有敏感文件..."
if [ -f "server/serviceAccountKey.json" ]; then
    if git ls-files --error-unmatch server/serviceAccountKey.json 2>/dev/null; then
        echo "❌ serviceAccountKey.json 已被 Git 追踪！请移除："
        echo "   git rm --cached server/serviceAccountKey.json"
        exit 1
    else
        echo "✅ serviceAccountKey.json 未被追踪"
    fi
fi

# 检查环境变量文件
echo ""
echo "⚙️  检查环境变量配置..."
if [ -f "server/.env.example" ]; then
    echo "✅ server/.env.example 存在"
else
    echo "⚠️  建议创建 server/.env.example 作为环境变量模板"
fi

if [ -f "client/.env.production" ]; then
    echo "✅ client/.env.production 存在"
else
    echo "❌ client/.env.production 缺失"
    exit 1
fi

# 检查依赖
echo ""
echo "📦 检查依赖安装..."
if [ -d "server/node_modules" ] && [ -d "client/node_modules" ]; then
    echo "✅ 依赖已安装"
else
    echo "⚠️  部分依赖未安装，运行："
    echo "   cd server && npm install"
    echo "   cd client && npm install"
fi

# 检查构建命令
echo ""
echo "🏗️  测试构建..."
cd client
if npm run build > /dev/null 2>&1; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败，请检查错误"
    exit 1
fi
cd ..

echo ""
echo "✅ 所有检查通过！可以部署到 Render"
echo ""
echo "📝 下一步："
echo "1. 提交代码到 GitHub: git add . && git commit -m 'Ready for deployment' && git push"
echo "2. 登录 Render Dashboard: https://dashboard.render.com"
echo "3. 按照 DEPLOY.md 文档部署服务"
