#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 打印标题
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 菜品毛利计算系统 - 一键启动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    print_error "未检测到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    read -p "按任意键退出..."
    exit 1
fi

print_success "Node.js 已安装: $(node -v)"

# 进入项目根目录
cd "$(dirname "$0")"
print_info "当前目录: $(pwd)"

# 检查前端依赖
print_info "检查前端依赖..."
if [ ! -d "node_modules" ]; then
    print_warning "前端依赖未安装，正在安装..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "前端依赖安装完成"
    else
        print_error "前端依赖安装失败"
        read -p "按任意键退出..."
        exit 1
    fi
else
    print_success "前端依赖已安装"
fi

# 检查后端依赖
print_info "检查后端依赖..."
if [ ! -d "backend/node_modules" ]; then
    print_warning "后端依赖未安装，正在安装..."
    cd backend
    npm install
    if [ $? -eq 0 ]; then
        print_success "后端依赖安装完成"
        cd ..
    else
        print_error "后端依赖安装失败"
        read -p "按任意键退出..."
        exit 1
    fi
else
    print_success "后端依赖已安装"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎯 正在启动服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "前端地址: ${GREEN}http://localhost:5173${NC}"
print_info "后端 API: ${GREEN}http://localhost:3001/api${NC}"
echo ""
print_warning "按 Ctrl+C 可以停止服务"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动服务
npm run dev:all
