<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1963y1-LPKC-iRIH96xH40RzGIdldegh1

## Run Locally

**Prerequisites:** Node.js

### 方式一：一键启动（推荐）

同时启动前端和后端服务，自动处理端口配置：

```bash
# 1. 安装所有依赖（前端 + 后端）
npm install
cd backend && npm install && cd ..

# 2. 一键启动前后端
npm run dev:all
```

这将同时启动：
- 前端服务：http://localhost:5173 (Vite 默认端口)
- 后端 API：http://localhost:3001/api

### 方式二：分别启动

如果需要分别调试前后端：

```bash
# 终端 1 - 启动后端
cd backend
npm run dev

# 终端 2 - 启动前端
npm run dev
```

### 环境配置

项目已配置好端口，确保以下文件保持一致：

- **前端 API 配置** (`.env`):
  ```
  VITE_API_URL=http://localhost:3001/api
  ```

- **后端端口配置** (`backend/.env`):
  ```
  PORT=3001
  ```

> 💡 **提示**：如果修改了端口，请同步修改这两个文件。

### 旧版启动方式（仅前端）

如果只需要前端功能（不含后端数据库）：

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
