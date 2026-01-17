import {
  executeQuery,
  executeUpdate,
  saveDatabase,
  getCurrentTimestamp,
} from '../config/database.js';
import { MealPlan, CreateMealRequest, UpdateMealRequest } from '../types.js';
import { dishService } from './dishesService.js';

export class MealService {
  /**
   * 获取所有套餐（含菜品详情）
   */
  getAll(options: { includeDishes?: boolean; includeDeleted?: boolean } = {}): MealPlan[] {
    let sql = 'SELECT * FROM meal_plans';
    const params: any[] = [];

    if (!options.includeDeleted) {
      sql += ' WHERE deleted_at IS NULL';
    }

    sql += ' ORDER BY sort_order';

    const meals = executeQuery<MealPlan>(sql, params);

    if (options.includeDishes !== false) {
      // 获取所有套餐的菜品关联
      const mealIds = meals.map((m) => m.id);
      if (mealIds.length > 0) {
        const placeholders = mealIds.map(() => '?').join(',');
        const dishRelations = executeQuery<any>(
          `SELECT meal_id, dish_id FROM meal_dishes
           WHERE meal_id IN (${placeholders})
           ORDER BY meal_id, dish_order`,
          mealIds
        );

        // 构建菜品 ID 映射
        const dishMap = new Map<string, string[]>();
        dishRelations.forEach((rel) => {
          if (!dishMap.has(rel.meal_id)) {
            dishMap.set(rel.meal_id, []);
          }
          dishMap.get(rel.meal_id)!.push(rel.dish_id);
        });

        // 为每个套餐添加 dishIds
        meals.forEach((meal) => {
          (meal as any).dishIds = dishMap.get(meal.id) || [];
        });
      }
    }

    return meals;
  }

  /**
   * 根据 ID 获取套餐
   */
  getById(id: string): MealPlan | null {
    const results = executeQuery<MealPlan>(
      'SELECT * FROM meal_plans WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (results.length === 0) {
      return null;
    }

    const meal = results[0];

    // 获取菜品列表
    const dishRelations = executeQuery<any>(
      'SELECT dish_id FROM meal_dishes WHERE meal_id = ? ORDER BY dish_order',
      [id]
    );

    (meal as any).dishIds = dishRelations.map((rel) => rel.dish_id);

    return meal;
  }

  /**
   * 创建套餐
   */
  create(data: CreateMealRequest): MealPlan {
    const id = Date.now().toString();
    const now = getCurrentTimestamp();

    executeUpdate(
      `INSERT INTO meal_plans (id, name, standard_price, promo_price1, promo_price2, sort_order, created_at, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
      [
        id,
        data.name,
        data.standard_price,
        data.promo_price1,
        data.promo_price2 || null,
        data.sort_order || 0,
        now,
        now,
      ]
    );

    // 插入菜品关联
    if (data.dish_ids && data.dish_ids.length > 0) {
      data.dish_ids.forEach((dishId, index) => {
        const relationId = `${id}-${dishId}-${index}`;
        executeUpdate(
          'INSERT INTO meal_dishes (id, meal_id, dish_id, dish_order, created_at) VALUES (?, ?, ?, ?, ?)',
          [relationId, id, dishId, index, now]
        );
      });
    }

    saveDatabase();

    return this.getById(id)!;
  }

  /**
   * 更新套餐
   */
  update(id: string, data: UpdateMealRequest): MealPlan | null {
    const meal = this.getById(id);
    if (!meal) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.standard_price !== undefined) {
      updates.push('standard_price = ?');
      params.push(data.standard_price);
    }
    if (data.promo_price1 !== undefined) {
      updates.push('promo_price1 = ?');
      params.push(data.promo_price1);
    }
    if (data.promo_price2 !== undefined) {
      updates.push('promo_price2 = ?');
      params.push(data.promo_price2);
    }
    if (data.sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(data.sort_order);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      params.push(getCurrentTimestamp());
      params.push(id);

      executeUpdate(`UPDATE meal_plans SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // 更新菜品关联
    if (data.dish_ids !== undefined) {
      // 删除旧的关联
      executeUpdate('DELETE FROM meal_dishes WHERE meal_id = ?', [id]);

      // 插入新的关联
      data.dish_ids.forEach((dishId, index) => {
        const relationId = `${id}-${dishId}-${index}`;
        executeUpdate(
          'INSERT INTO meal_dishes (id, meal_id, dish_id, dish_order, created_at) VALUES (?, ?, ?, ?, ?)',
          [relationId, id, dishId, index, getCurrentTimestamp()]
        );
      });
    }

    saveDatabase();

    return this.getById(id);
  }

  /**
   * 删除套餐（软删除）
   */
  delete(id: string): boolean {
    const meal = this.getById(id);
    if (!meal) {
      return false;
    }

    executeUpdate('UPDATE meal_plans SET deleted_at = ? WHERE id = ?', [getCurrentTimestamp(), id]);

    saveDatabase();

    return true;
  }

  /**
   * 批量重新排序套餐
   */
  reorder(mealOrders: Array<{ id: string; sort_order: number }>): void {
    const now = getCurrentTimestamp();

    mealOrders.forEach(({ id, sort_order }) => {
      executeUpdate('UPDATE meal_plans SET sort_order = ?, updated_at = ? WHERE id = ?', [
        sort_order,
        now,
        id,
      ]);
    });

    saveDatabase();
  }
}

// 导出单例
export const mealService = new MealService();
