import { Router } from 'express';
import dishesRouter from './dishes.js';
import mealsRouter from './meals.js';
import categoriesRouter from './categories.js';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MarginMaster Backend',
    },
  });
});

// 挂载路由
router.use('/dishes', dishesRouter);
router.use('/meals', mealsRouter);
router.use('/categories', categoriesRouter);

// 重新排序路由应该在 meals 之前定义，避免冲突
router.use('/meals/reorder', (req, res, next) => {
  // 这个路由在 meals.ts 中已经定义
  next();
});

export default router;
