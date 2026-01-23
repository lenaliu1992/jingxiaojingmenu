import {
  executeQuery,
  executeUpdate,
  executeInsert,
  saveDatabase,
  getCurrentTimestamp,
} from '../config/database.js';
import { Dish, CreateDishRequest, UpdateDishRequest, DuplicateCheckResult, BatchImportResult } from '../types.js';

export class DishService {
  /**
   * 获取所有菜品
   */
  getAll(options: { includeDeleted?: boolean; search?: string } = {}): Dish[] {
    let sql = 'SELECT * FROM dishes';
    const conditions: string[] = [];
    const params: any[] = [];

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (options.search) {
      conditions.push('name LIKE ?');
      params.push(`%${options.search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY name';

    return executeQuery<Dish>(sql, params);
  }

  /**
   * 根据 ID 获取菜品
   */
  getById(id: string): Dish | null {
    const results = executeQuery<Dish>(
      'SELECT * FROM dishes WHERE id = ? AND deleted_at IS NULL',
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

    executeUpdate(
      `INSERT INTO dishes (id, name, cost, price, created_at, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [id, data.name, data.cost, data.price || null, now, now]
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

    return this.getById(id);
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
