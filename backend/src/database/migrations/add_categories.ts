import { executeUpdate, saveDatabase, executeQuery } from '../../config/database.js';

/**
 * 添加菜品分类表的数据库迁移
 * 创建dish_categories表，为dishes表添加category_id字段，插入初始分类数据
 */
export async function migrateAddCategories() {
  console.log('🔄 开始分类表迁移...');

  // 1. 创建分类表
  executeUpdate(`
    CREATE TABLE IF NOT EXISTS dish_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT '🍽️',
      color TEXT NOT NULL DEFAULT '#6b7280',
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      source TEXT CHECK(source IN ('initial', 'user')) DEFAULT 'user'
    )
  `);

  console.log('✅ dish_categories 表已创建');

  // 2. 检查dishes表是否已有category_id字段，如果没有则添加
  const pragmaResult = executeQuery<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='dishes'"
  );

  if (pragmaResult[0] && !pragmaResult[0].sql.includes('category_id')) {
    executeUpdate(`ALTER TABLE dishes ADD COLUMN category_id TEXT`);
    console.log('✅ dishes.category_id 字段已添加');
  } else {
    console.log('ℹ️ dishes.category_id 字段已存在，跳过');
  }

  // 3. 创建索引
  executeUpdate(`CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id)`);
  executeUpdate(`CREATE INDEX IF NOT EXISTS idx_dish_categories_name ON dish_categories(name)`);
  executeUpdate(`CREATE INDEX IF NOT EXISTS idx_dish_categories_sort ON dish_categories(sort_order)`);
  executeUpdate(`CREATE INDEX IF NOT EXISTS idx_dish_categories_deleted ON dish_categories(deleted_at)`);

  console.log('✅ 索引已创建');

  // 4. 检查是否已有分类数据，如果没有则插入初始分类
  const existingCategories = executeQuery<{ count: number }>(
    'SELECT COUNT(*) as count FROM dish_categories WHERE source = "initial"'
  );

  if (existingCategories[0].count === 0) {
    const now = Math.floor(Date.now() / 1000);
    const categories = [
      { id: 'cat_1', name: '主食', icon: '🍚', color: '#10b981', description: '米饭、面食等主食' },
      { id: 'cat_2', name: '青菜', icon: '🥬', color: '#22c55e', description: '各类蔬菜菜品' },
      { id: 'cat_3', name: '荤菜', icon: '🍖', color: '#ef4444', description: '肉类菜品' },
      { id: 'cat_4', name: '汤类', icon: '🍲', color: '#f59e0b', description: '各种汤品' },
      { id: 'cat_5', name: '饮品', icon: '🥤', color: '#3b82f6', description: '饮料、茶水' },
      { id: 'cat_6', name: '小吃', icon: '🍢', color: '#8b5cf6', description: '小食、零食' },
      { id: 'cat_7', name: '海鲜', icon: '🦐', color: '#06b6d4', description: '海鲜类菜品' },
      { id: 'cat_8', name: '其他', icon: '🍽️', color: '#6b7280', description: '其他菜品' },
    ];

    categories.forEach((cat, index) => {
      executeUpdate(`
        INSERT OR IGNORE INTO dish_categories
        (id, name, icon, color, description, sort_order, created_at, updated_at, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'initial')
      `, [cat.id, cat.name, cat.icon, cat.color, cat.description, index + 1, now, now]);
    });

    console.log('✅ 初始分类数据已插入');
  } else {
    console.log('ℹ️ 初始分类数据已存在，跳过');
  }

  // 5. 为没有分类的菜品设置默认分类（其他）
  executeUpdate(`
    UPDATE dishes
    SET category_id = 'cat_8', updated_at = ?
    WHERE category_id IS NULL
  `, [Math.floor(Date.now() / 1000)]);

  console.log('✅ 现有菜品已设置默认分类');

  saveDatabase();
  console.log('✅ 分类表迁移完成');
}
