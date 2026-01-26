import { executeQuery, executeUpdate, saveDatabase } from '../config/database.js';
import {
  DishCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types.js';

export class CategoryService {
  /**
   * 获取所有分类
   */
  getAll(options: { includeDeleted?: boolean } = {}): DishCategory[] {
    let sql = 'SELECT * FROM dish_categories';
    const conditions: string[] = [];

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY sort_order ASC';

    return executeQuery<DishCategory>(sql);
  }

  /**
   * 根据 ID 获取分类
   */
  getById(id: string): DishCategory | null {
    const results = executeQuery<DishCategory>(
      'SELECT * FROM dish_categories WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return results[0] || null;
  }

  /**
   * 创建分类
   */
  create(data: CreateCategoryRequest): DishCategory {
    const id = 'cat_' + Date.now() + Math.random().toString(36).substring(7);
    const now = Math.floor(Date.now() / 1000);

    // 获取当前最大sort_order
    const maxOrder = executeQuery<{ max_order: number }>(
      'SELECT MAX(sort_order) as max_order FROM dish_categories WHERE deleted_at IS NULL'
    )[0]?.max_order || 0;

    executeUpdate(
      `INSERT INTO dish_categories (id, name, icon, color, description, sort_order, created_at, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user')`,
      [
        id,
        data.name,
        data.icon || '🍽️',
        data.color || '#6b7280',
        data.description || null,
        maxOrder + 1,
        now,
        now,
      ]
    );

    saveDatabase();
    return this.getById(id)!;
  }

  /**
   * 更新分类
   */
  update(id: string, data: UpdateCategoryRequest): DishCategory | null {
    const category = this.getById(id);
    if (!category) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      params.push(data.icon);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (updates.length === 0) {
      return category;
    }

    updates.push('updated_at = ?');
    params.push(Math.floor(Date.now() / 1000));
    params.push(id);

    executeUpdate(
      `UPDATE dish_categories SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    saveDatabase();
    return this.getById(id);
  }

  /**
   * 删除分类（软删除）
   */
  delete(id: string, replaceWith?: string): boolean {
    const category = this.getById(id);
    if (!category) {
      return false;
    }

    // 如果有替换分类，先将使用此分类的菜品迁移到新分类
    if (replaceWith) {
      executeUpdate(
        'UPDATE dishes SET category_id = ?, updated_at = ? WHERE category_id = ?',
        [replaceWith, Math.floor(Date.now() / 1000), id]
      );
    } else {
      // 检查是否有菜品使用此分类
      const dishCount = executeQuery<{ count: number }>(
        'SELECT COUNT(*) as count FROM dishes WHERE category_id = ? AND deleted_at IS NULL',
        [id]
      )[0]?.count || 0;

      if (dishCount > 0) {
        throw new Error(`无法删除：还有 ${dishCount} 个菜品使用此分类，请先选择新分类或删除这些菜品`);
      }
    }

    executeUpdate(
      'UPDATE dish_categories SET deleted_at = ? WHERE id = ?',
      [Math.floor(Date.now() / 1000), id]
    );

    saveDatabase();
    return true;
  }

  /**
   * 重新排序分类
   */
  reorder(orders: Array<{ id: string; sort_order: number }>): void {
    const now = Math.floor(Date.now() / 1000);
    orders.forEach(({ id, sort_order }) => {
      executeUpdate(
        'UPDATE dish_categories SET sort_order = ?, updated_at = ? WHERE id = ?',
        [sort_order, now, id]
      );
    });
    saveDatabase();
  }
}

export const categoryService = new CategoryService();
