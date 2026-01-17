import { Router, Request, Response } from 'express';
import { mealService } from '../services/mealsService.js';
import { CreateMealRequest, UpdateMealRequest, ApiResponse } from '../types.js';

const router = Router();

// 获取所有套餐
router.get('/', (req: Request, res: Response) => {
  try {
    const includeDishes = req.query.include_dishes !== 'false';
    const includeDeleted = req.query.include_deleted === 'true';

    const meals = mealService.getAll({ includeDishes, includeDeleted });

    res.json({ success: true, data: meals });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_MEALS_FAILED',
        message: error.message,
      },
    });
  }
});

// 获取单个套餐
router.get('/:id', (req: Request, res: Response) => {
  try {
    const meal = mealService.getById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: '套餐不存在',
        },
      });
    }

    res.json({ success: true, data: meal });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_MEAL_FAILED',
        message: error.message,
      },
    });
  }
});

// 创建套餐
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateMealRequest = req.body;

    // 验证
    if (!data.name || typeof data.name !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: '套餐名称无效',
        },
      });
    }

    if (!Array.isArray(data.dish_ids)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DISH_IDS',
          message: 'dish_ids 必须是数组',
        },
      });
    }

    if (typeof data.standard_price !== 'number' || data.standard_price < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STANDARD_PRICE',
          message: '套餐原价必须是非负数',
        },
      });
    }

    if (typeof data.promo_price1 !== 'number' || data.promo_price1 < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROMO_PRICE1',
          message: '秒杀价1必须是非负数',
        },
      });
    }

    const meal = mealService.create(data);

    res.status(201).json({ success: true, data: meal });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_MEAL_FAILED',
        message: error.message,
      },
    });
  }
});

// 更新套餐
router.put('/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateMealRequest = req.body;

    // 验证
    if (data.dish_ids !== undefined && !Array.isArray(data.dish_ids)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DISH_IDS',
          message: 'dish_ids 必须是数组',
        },
      });
    }

    const meal = mealService.update(req.params.id, data);

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: '套餐不存在',
        },
      });
    }

    res.json({ success: true, data: meal });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_MEAL_FAILED',
        message: error.message,
      },
    });
  }
});

// 删除套餐
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = mealService.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: '套餐不存在',
        },
      });
    }

    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_MEAL_FAILED',
        message: error.message,
      },
    });
  }
});

// 批量重新排序套餐
router.put('/reorder', (req: Request, res: Response) => {
  try {
    const { meal_orders } = req.body;

    if (!Array.isArray(meal_orders)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'meal_orders 必须是数组',
        },
      });
    }

    mealService.reorder(meal_orders);

    res.json({ success: true, data: { message: '排序已更新' } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REORDER_FAILED',
        message: error.message,
      },
    });
  }
});

export default router;
