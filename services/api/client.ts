import axios, { AxiosError } from 'axios';

// API URL 配置
// 开发环境：使用 .env 中的 VITE_API_URL，默认 http://localhost:3001/api
// 生产环境：在 Vercel 环境变量中设置 VITE_API_URL（例如 Railway 后端地址）
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器：统一处理响应和错误
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const message = error.response?.data?.error?.message || error.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);
