/**
 * 清理数据库中的重复菜品（简化版）
 *
 * 使用方法：
 * cd backend
 * npm run clean-duplicates
 *
 * 策略：
 * - 对于重复的菜品（名称相同），保留最早创建的那个
 * - 删除其他重复的菜品
 * - 更新套餐中的菜品引用
 */

import { initDatabase } from '../config/database.js';
import { dishService } from '../services/dishesService.js';
import { executeQuery, executeUpdate, saveDatabase } from '../config/database.js';

interface DuplicateGroup {
  name: string;
  keepId: string;
  removeIds: string[];
}

async function cleanDuplicates() {
  console.log('🔍 开始检查重复菜品...\n');

  try {
    // 0. 初始化数据库
    console.log('📦 正在初始化数据库...\n');
    await initDatabase();
    console.log('✅ 数据库初始化完成\n');

    // 1. 获取所有未删除的菜品
    const allDishes = dishService.getAll({ includeDeleted: false });

    if (allDishes.length === 0) {
      console.log('数据库中没有菜品数据');
      return;
    }

    console.log(`📊 数据库中共有 ${allDishes.length} 个菜品\n`);

    // 2. 按名称分组，找出重复的
    const nameMap = new Map<string, any[]>();

    allDishes.forEach((dish) => {
      const normalizedName = dish.name.trim();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(dish);
    });

    // 3. 找出重复组
    const duplicateGroups: DuplicateGroup[] = [];
    let totalDuplicates = 0;

    nameMap.forEach((dishes, name) => {
      if (dishes.length > 1) {
        // 按创建时间排序，保留最早的
        dishes.sort((a, b) => a.created_at - b.created_at);

        const removeIds = dishes.slice(1).map((d) => d.id);
        duplicateGroups.push({
          name,
          keepId: dishes[0].id,
          removeIds,
        });
        totalDuplicates += removeIds.length;
      }
    });

    if (duplicateGroups.length === 0) {
      console.log('✅ 没有发现重复菜品，数据库很干净！');
      return;
    }

    console.log(`⚠️  发现 ${duplicateGroups.length} 组重复菜品：\n`);

    // 4. 显示重复菜品信息
    duplicateGroups.forEach((group, index) => {
      console.log(`${index + 1}. "${group.name}"`);
      console.log(`   ✅ 保留: ID=${group.keepId}`);
      console.log(`   ❌ 删除: ${group.removeIds.length} 个重复项 (IDs: ${group.removeIds.join(', ')})`);
      console.log('');
    });

    console.log(`📋 统计：`);
    console.log(`   - 重复组数: ${duplicateGroups.length} 组`);
    console.log(`   - 重复菜品: ${totalDuplicates} 个`);
    console.log(`   - 清理后剩余: ${allDishes.length - totalDuplicates} 个菜品\n`);

    // 5. 自动执行清理（跳过确认）
    console.log(`⚠️  即将删除 ${totalDuplicates} 个重复菜品...\n`);
    console.log('🧹 开始清理...\n');

    // 6. 更新套餐中的菜品引用
    let updatedMealsCount = 0;
    const idMapping = new Map<string, string>();

    duplicateGroups.forEach((group) => {
      group.removeIds.forEach((oldId) => {
        idMapping.set(oldId, group.keepId);
      });
    });

    // 获取所有套餐-菜品关联
    const mealDishes = executeQuery<any>('SELECT * FROM meal_dishes');

    mealDishes.forEach((md) => {
      const newDishId = idMapping.get(md.dish_id);
      if (newDishId) {
        executeUpdate('UPDATE meal_dishes SET dish_id = ? WHERE id = ?', [newDishId, md.id]);
        updatedMealsCount++;
        console.log(`  🔄 更新套餐关联: ${md.dish_id} → ${newDishId}`);
      }
    });

    console.log(`\n✅ 更新了 ${updatedMealsCount} 个套餐菜品关联\n`);

    // 7. 软删除重复菜品
    let deletedCount = 0;

    duplicateGroups.forEach((group) => {
      group.removeIds.forEach((id) => {
        const success = dishService.delete(id);
        if (success) {
          deletedCount++;
          console.log(`  🗑️  删除重复菜品: "${group.name}" (ID: ${id})`);
        }
      });
    });

    console.log(`\n✅ 删除了 ${deletedCount} 个重复菜品`);

    // 8. 保存数据库
    saveDatabase();

    console.log('\n✨ 清理完成！\n');
    console.log(`📊 最终统计：`);
    console.log(`   - 清理前: ${allDishes.length} 个菜品`);
    console.log(`   - 清理后: ${allDishes.length - deletedCount} 个菜品`);
    console.log(`   - 删除重复: ${deletedCount} 个`);
    console.log(`   - 更新套餐: ${updatedMealsCount} 个关联`);
  } catch (error) {
    console.error('❌ 清理过程中出错:', error);
    process.exit(1);
  }
}

// 运行清理脚本
cleanDuplicates();
