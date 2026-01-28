import {
  executeQuery,
  executeUpdate,
  executeInsert,
  saveDatabase,
  getCurrentTimestamp,
} from '../config/database.js';
import { Dish, CreateDishRequest, UpdateDishRequest, DuplicateCheckResult, BatchImportResult, DishCategory } from '../types.js';
import { CategoryService } from './categoriesService.js';

export class DishService {
  /**
   * 获取所有菜品
   */
  getAll(options: { includeDeleted?: boolean; search?: string } = {}): Dish[] {
    let sql = `
      SELECT
        d.*,
        dc.name as category_name
      FROM dishes d
      LEFT JOIN dish_categories dc ON d.category_id = dc.id AND dc.deleted_at IS NULL
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (!options.includeDeleted) {
      conditions.push('d.deleted_at IS NULL');
    }

    if (options.search) {
      conditions.push('d.name LIKE ?');
      params.push(`%${options.search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY d.name';

    return executeQuery<Dish>(sql, params);
  }

  /**
   * 根据 ID 获取菜品
   */
  getById(id: string): Dish | null {
    const results = executeQuery<Dish>(
      `
      SELECT
        d.*,
        dc.name as category_name
      FROM dishes d
      LEFT JOIN dish_categories dc ON d.category_id = dc.id AND dc.deleted_at IS NULL
      WHERE d.id = ? AND d.deleted_at IS NULL
      `,
      [id]
    );
    return results[0] || null;
  }

  /**
   * 创建菜品
   */
  create(data: CreateDishRequest): Dish {
    const id = Date.now().toString();
    const now = getCurrentTimestamp();

    // 如果提供了category_id，先验证分类是否存在
    let categoryId = null;
    if (data.category_id) {
      categoryId = data.category_id;
    }

    executeUpdate(
      `INSERT INTO dishes (id, name, cost, price, category_id, created_at, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`,
      [id, data.name, data.cost, data.price || null, categoryId, now, now]
    );

    saveDatabase();

    return this.getById(id)!;
  }

  /**
   * 更新菜品
   */
  update(id: string, data: UpdateDishRequest): Dish | null {
    const dish = this.getById(id);
    if (!dish) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.cost !== undefined) {
      updates.push('cost = ?');
      params.push(data.cost);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      params.push(data.price);
    }

    // 处理 category 字段（字符串），需要查找对应的 category_id
    if (data.category !== undefined) {
      // 根据分类名称查找分类ID
      const categoryService = new CategoryService();
      const categories = categoryService.getAll();
      const category = categories.find((c: DishCategory) => c.name === data.category);

      if (category) {
        updates.push('category_id = ?');
        params.push(category.id);
      } else {
        // 如果找不到分类，设置为 null
        updates.push('category_id = ?');
        params.push(null);
      }
    }

    // 直接处理 category_id
    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(data.category_id);
    }

    if (updates.length === 0) {
      return dish;
    }

    updates.push('updated_at = ?');
    params.push(getCurrentTimestamp());
    params.push(id);

    executeUpdate(
      `UPDATE dishes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    saveDatabase();

    // 价格自动同步逻辑：如果修改了cost或price，更新所有关联的单品套餐
    if (data.cost !== undefined || data.price !== undefined) {
      this.syncSingleDishMealPrices(id, data.cost !== undefined ? data.cost : dish.cost, data.price !== undefined ? data.price : dish.price);
    }

    return this.getById(id);
  }

  /**
   * 同步单品套餐的价格
   */
  private syncSingleDishMealPrices(dishId: string, newCost: number, newPrice?: number): void {
    // 查找所有关联该菜品的单品套餐
    const singleDishMeals = executeQuery<any>(
      'SELECT * FROM meal_plans WHERE is_single_dish = 1 AND sync_dish_id = ? AND deleted_at IS NULL',
      [dishId]
    );

    if (singleDishMeals.length === 0) {
      return;
    }

    // 计算新的套餐价格
    const standardPrice = newPrice || newCost * 1.5;
    const promoPrice1 = newCost * 1.2;

    // 更新所有单品套餐的价格
    singleDishMeals.forEach((meal) => {
      executeUpdate(
        'UPDATE meal_plans SET standard_price = ?, promo_price1 = ?, updated_at = ? WHERE id = ?',
        [standardPrice, promoPrice1, getCurrentTimestamp(), meal.id]
      );
    });

    saveDatabase();
  }

  /**
   * 删除菜品（软删除）
   */
  delete(id: string): boolean {
    const dish = this.getById(id);
    if (!dish) {
      return false;
    }

    executeUpdate(
      'UPDATE dishes SET deleted_at = ? WHERE id = ?',
      [getCurrentTimestamp(), id]
    );

    saveDatabase();

    return true;
  }

  /**
   * 批量创建菜品
   */
  batchCreate(data: CreateDishRequest[]): Dish[] {
    const now = getCurrentTimestamp();
    const dishes: Dish[] = [];

    data.forEach((item) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      executeUpdate(
        `INSERT INTO dishes (id, name, cost, price, created_at, updated_at, source)
         VALUES (?, ?, ?, ?, ?, ?, 'user')`,
        [id, item.name, item.cost, item.price || null, now, now]
      );
      dishes.push(this.getById(id)!);
    });

    saveDatabase();

    return dishes;
  }

  /**
   * 检查菜品名称是否已存在
   */
  checkDuplicate(name: string, excludeId?: string): DuplicateCheckResult {
    const normalizedName = name.trim();
    const allDishes = this.getAll({ includeDeleted: false });

    const existing = allDishes.find((d) => {
      if (excludeId && d.id === excludeId) return false;
      return d.name.trim() === normalizedName;
    });

    return {
      isDuplicate: !!existing,
      existingDish: existing,
    };
  }

  /**
   * 批量创建菜品（支持重复处理策略）
   */
  batchCreateWithStrategy(
    dishes: CreateDishRequest[],
    strategy: 'skip' | 'update' | 'create_all'
  ): Omit<BatchImportResult, 'summary'> {
    const result = {
      created: [] as Dish[],
      updated: [] as Dish[],
      skipped: [] as string[],
    };

    if (strategy === 'create_all') {
      // 全部创建，不检查重复
      dishes.forEach((dishData) => {
        const newDish = this.create(dishData);
        result.created.push(newDish);
      });
      return result;
    }

    // 批量检查重复
    const allDishes = this.getAll({ includeDeleted: false });
    const nameIndex = new Map<string, Dish>();
    allDishes.forEach((dish) => {
      nameIndex.set(dish.name.trim(), dish);
    });

    dishes.forEach((dishData) => {
      const normalizedName = dishData.name.trim();
      const existing = nameIndex.get(normalizedName);

      if (!existing) {
        // 新菜品，创建
        const newDish = this.create(dishData);
        result.created.push(newDish);
      } else if (strategy === 'skip') {
        // 跳过重复
        result.skipped.push(dishData.name);
      } else if (strategy === 'update') {
        // 更新现有菜品
        const updated = this.update(existing.id, dishData);
        if (updated) {
          result.updated.push(updated);
        }
      }
    });

    return result;
  }
}

// 导出单例
export const dishService = new DishService();
