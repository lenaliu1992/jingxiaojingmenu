#!/bin/bash

# 菜品毛利计算 - 启动脚本

echo "🚀 正在启动菜品毛利计算应用..."

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🌐 正在启动服务器..."
npm run dev
