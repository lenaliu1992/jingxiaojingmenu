import express, { Application } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { initDatabase, closeDatabase } from './config/database.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// 加载环境变量
config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api', apiRouter);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 正在启动 MarginMaster 后端服务...');

    // 初始化数据库
    await initDatabase();
    console.log('✅ 数据库已初始化');

    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  🎉 MarginMaster 后端服务已启动！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  📍 服务地址: http://localhost:${PORT}`);
      console.log(`  🔗 API 地址:  http://localhost:${PORT}/api`);
      console.log(`  ❤️  健康检查:  http://localhost:${PORT}/api/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\\n\\n🛑 收到关闭信号，正在优雅关闭...');
  closeDatabase();
  console.log('✅ 服务已关闭');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n\\n🛑 收到终止信号，正在优雅关闭...');
  closeDatabase();
  console.log('✅ 服务已关闭');
  process.exit(0);
});

// 启动
startServer();
