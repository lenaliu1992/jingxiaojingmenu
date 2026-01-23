import { Router, Request, Response } from 'express';
import { dishService } from '../services/dishesService.js';
import { CreateDishRequest, UpdateDishRequest, ApiResponse, BatchImportRequest } from '../types.js';

const router = Router();

// 获取所有菜品
router.get('/', (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const search = req.query.search as string | undefined;

    const dishes = dishService.getAll({ includeDeleted, search });

    const response: ApiResponse = {
      success: true,
      data: dishes,
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DISHES_FAILED',
        message: error.message,
      },
    });
  }
});

// 获取单个菜品
router.get('/:id', (req: Request, res: Response) => {
  try {
    const dish = dishService.getById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DISH_NOT_FOUND',
          message: '菜品不存在',
        },
      });
    }

    res.json({ success: true, data: dish });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DISH_FAILED',
        message: error.message,
      },
    });
  }
});

// 创建菜品
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateDishRequest = req.body;

    // 验证
    if (!data.name || typeof data.name !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: '菜品名称无效',
        },
      });
    }

    if (typeof data.cost !== 'number' || data.cost < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COST',
          message: '成本价必须是非负数',
        },
      });
    }

    const dish = dishService.create(data);

    res.status(201).json({ success: true, data: dish });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_DISH_FAILED',
        message: error.message,
      },
    });
  }
});

// 更新菜品
router.put('/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateDishRequest = req.body;

    // 验证
    if (data.cost !== undefined && (typeof data.cost !== 'number' || data.cost < 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COST',
          message: '成本价必须是非负数',
        },
      });
    }

    const dish = dishService.update(req.params.id, data);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DISH_NOT_FOUND',
          message: '菜品不存在',
        },
      });
    }

    res.json({ success: true, data: dish });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_DISH_FAILED',
        message: error.message,
      },
    });
  }
});

// 删除菜品
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = dishService.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DISH_NOT_FOUND',
          message: '菜品不存在',
        },
      });
    }

    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_DISH_FAILED',
        message: error.message,
      },
    });
  }
});

// 批量创建菜品
router.post('/batch', (req: Request, res: Response) => {
  try {
    const { dishes: dishesData }: { dishes: CreateDishRequest[] } = req.body;

    if (!Array.isArray(dishesData)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'dishes 必须是数组',
        },
      });
    }

    const dishes = dishService.batchCreate(dishesData);

    res.status(201).json({ success: true, data: dishes });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_CREATE_FAILED',
        message: error.message,
      },
    });
  }
});

// 检查菜品是否重复
router.post('/check-duplicate', (req: Request, res: Response) => {
  try {
    const { name, excludeId } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: '菜品名称无效',
        },
      });
    }

    const result = dishService.checkDuplicate(name, excludeId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CHECK_FAILED',
        message: error.message,
      },
    });
  }
});

// 批量导入菜品（支持重复处理策略）
router.post('/batch/import', (req: Request, res: Response) => {
  try {
    const { dishes, strategy = 'skip' }: BatchImportRequest = req.body;

    if (!Array.isArray(dishes)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'dishes 必须是数组',
        },
      });
    }

    const result = dishService.batchCreateWithStrategy(dishes, strategy);

    res.status(201).json({
      success: true,
      data: {
        summary: {
          total: dishes.length,
          created: result.created.length,
          updated: result.updated.length,
          skipped: result.skipped.length,
        },
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_IMPORT_FAILED',
        message: error.message,
      },
    });
  }
});

export default router;
