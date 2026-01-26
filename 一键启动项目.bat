@echo off
chcp 65001 >nul
title 菜品毛利计算系统 - 一键启动

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   🚀 菜品毛利计算系统 - 一键启动
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node -v
echo.

REM 进入项目根目录
cd /d "%~dp0"
echo ℹ️  当前目录: %cd%
echo.

REM 检查前端依赖
echo ℹ️  检查前端依赖...
if not exist "node_modules\" (
    echo ⚠️  前端依赖未安装，正在安装...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装完成
) else (
    echo ✅ 前端依赖已安装
)
echo.

REM 检查后端依赖
echo ℹ️  检查后端依赖...
if not exist "backend\node_modules\" (
    echo ⚠️  后端依赖未安装，正在安装...
    cd backend
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 后端依赖安装完成
    cd ..
) else (
    echo ✅ 后端依赖已安装
)
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   🎯 正在启动服务...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ℹ️  前端地址: http://localhost:5173
echo ℹ️  后端 API: http://localhost:3001/api
echo.
echo ⚠️  按 Ctrl+C 可以停止服务
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 启动服务
call npm run dev:all

pause
