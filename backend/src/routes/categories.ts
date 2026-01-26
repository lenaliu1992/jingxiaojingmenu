import { Router, Request, Response } from 'express';
import { categoryService } from '../services/categoriesService.js';
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ApiResponse,
} from '../types.js';

const router = Router();

// 获取所有分类
router.get('/', (req: Request, res: Response) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const categories = categoryService.getAll({ includeDeleted });

    const response: ApiResponse = {
      success: true,
      data: categories,
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CATEGORIES_FAILED',
        message: error.message,
      },
    });
  }
});

// 创建分类
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateCategoryRequest = req.body;

    // 验证
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: '分类名称不能为空',
        },
      });
    }

    const category = categoryService.create({
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
      description: data.description,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CATEGORY_FAILED',
        message: error.message,
      },
    });
  }
});

// 更新分类
router.put('/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateCategoryRequest = req.body;
    const category = categoryService.update(req.params.id, data);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '分类不存在',
        },
      });
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CATEGORY_FAILED',
        message: error.message,
      },
    });
  }
});

// 删除分类
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const replaceWith = req.body.replace_with as string | undefined;
    const success = categoryService.delete(req.params.id, replaceWith);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '分类不存在',
        },
      });
    }

    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_CATEGORY_FAILED',
        message: error.message,
      },
    });
  }
});

// 重新排序
router.post('/reorder', (req: Request, res: Response) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'orders 必须是数组',
        },
      });
    }

    categoryService.reorder(orders);
    res.json({ success: true, data: { message: '排序成功' } });
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
