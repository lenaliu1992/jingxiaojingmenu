import { executeUpdate, saveDatabase, executeQuery } from '../../config/database.js';

/**
 * 添加单品套餐功能的数据库迁移
 * 为meal_plans表添加is_single_dish和sync_dish_id字段
 */
export async function migrateAddSingleDishMeal() {
  console.log('🔄 开始单品套餐表迁移...');

  // 1. 检查meal_plans表是否已有is_single_dish字段，如果没有则添加
  const pragmaResult = executeQuery<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='meal_plans'"
  );

  if (pragmaResult[0] && !pragmaResult[0].sql.includes('is_single_dish')) {
    executeUpdate(`ALTER TABLE meal_plans ADD COLUMN is_single_dish BOOLEAN DEFAULT 0`);
    console.log('✅ meal_plans.is_single_dish 字段已添加');
  } else {
    console.log('ℹ️ meal_plans.is_single_dish 字段已存在，跳过');
  }

  // 2. 检查meal_plans表是否已有sync_dish_id字段，如果没有则添加
  const pragmaResult2 = executeQuery<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='meal_plans'"
  );

  if (pragmaResult2[0] && !pragmaResult2[0].sql.includes('sync_dish_id')) {
    executeUpdate(`ALTER TABLE meal_plans ADD COLUMN sync_dish_id TEXT`);
    console.log('✅ meal_plans.sync_dish_id 字段已添加');
  } else {
    console.log('ℹ️ meal_plans.sync_dish_id 字段已存在，跳过');
  }

  // 3. 创建索引
  executeUpdate(`CREATE INDEX IF NOT EXISTS idx_meal_plans_single_dish ON meal_plans(is_single_dish)`);
  executeUpdate(`CREATE INDEX IF NOT EXISTS idx_meal_plans_sync_dish ON meal_plans(sync_dish_id)`);

  console.log('✅ 索引已创建');

  saveDatabase();
  console.log('✅ 单品套餐表迁移完成');
}
