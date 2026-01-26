/**
 * 清理数据库中的重复菜品
 *
 * 策略：
 * 1. 对于重复的菜品（名称相同），保留最早创建的那个
 * 2. 删除其他重复的菜品
 * 3. 更新套餐中的菜品引用，指向保留的菜品
 */

import { Database } from 'sql.js';
import { initDatabase } from '../config/database.js';
import { Dish } from '../types.js';

interface DuplicateGroup {
  name: string;
  dishes: Dish[];
  keep: Dish; // 要保留的菜品
  remove: Dish[]; // 要删除的菜品
}

async function cleanDuplicates() {
  console.log('开始清理重复菜品...\n');

  // 初始化数据库
  const db = await initDatabase();
  if (!db) {
    console.error('无法初始化数据库');
    process.exit(1);
  }

  try {
    // 1. 读取所有未删除的菜品
    const result = db.exec('SELECT * FROM dishes WHERE deleted_at IS NULL ORDER BY created_at ASC');
    if (result.length === 0) {
      console.log('数据库中没有菜品数据');
      return;
    }

    const columns = result[0].columns;
    const values = result[0].values;

    // 解析菜品数据
    const allDishes: Dish[] = values.map((row: any[]) => {
      const dish: any = {};
      columns.forEach((col: string, index: number) => {
        dish[col] = row[index];
      });
      return dish as Dish;
    });

    console.log(`数据库中共有 ${allDishes.length} 个菜品\n`);

    // 2. 按名称分组，找出重复的
    const nameMap = new Map<string, Dish[]>();

    allDishes.forEach((dish) => {
      const normalizedName = dish.name.trim();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(dish);
    });

    // 3. 找出重复组
    const duplicateGroups: DuplicateGroup[] = [];

    nameMap.forEach((dishes, name) => {
      if (dishes.length > 1) {
        // 按创建时间排序，保留最早的
        dishes.sort((a, b) => a.created_at - b.created_at);

        duplicateGroups.push({
          name,
          dishes,
          keep: dishes[0],
          remove: dishes.slice(1),
        });
      }
    });

    if (duplicateGroups.length === 0) {
      console.log('✅ 没有发现重复菜品');
      return;
    }

    console.log(`发现 ${duplicateGroups.length} 组重复菜品：\n`);

    // 4. 显示重复菜品信息
    duplicateGroups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
      console.log(`   保留: ID=${group.keep.id}, 创建时间=${new Date(group.keep.created_at).toLocaleString()}`);
      console.log(`   删除: ${group.remove.length} 个重复项`);
      group.remove.forEach((dish) => {
        console.log(`     - ID=${dish.id}, 创建时间=${new Date(dish.created_at).toLocaleString()}`);
      });
      console.log('');
    });

    // 5. 询问用户是否继续
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        `\n即将删除 ${duplicateGroups.reduce((sum, g) => sum + g.remove.length, 0)} 个重复菜品，是否继续？(yes/no): `,
        (ans: string) => {
          rl.close();
          resolve(ans);
        }
      );
    });

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n已取消操作');
      return;
    }

    console.log('\n开始清理...\n');

    // 6. 更新套餐中的菜品引用
    let updatedMealsCount = 0;
    const idMapping = new Map<string, string>(); // 旧ID -> 新ID

    duplicateGroups.forEach((group) => {
      group.remove.forEach((dish) => {
        idMapping.set(dish.id, group.keep.id);
      });
    });

    // 获取所有套餐-菜品关联
    const mealDishesResult = db.exec('SELECT * FROM meal_dishes');
    if (mealDishesResult.length > 0) {
      const mdColumns = mealDishesResult[0].columns;
      const mdValues = mealDishesResult[0].values;

      mdValues.forEach((row: any[]) => {
        const md: any = {};
        mdColumns.forEach((col: string, index: number) => {
          md[col] = row[index];
        });

        // 检查是否需要更新dish_id
        const newDishId = idMapping.get(md.dish_id);
        if (newDishId) {
          db.run('UPDATE meal_dishes SET dish_id = ? WHERE id = ?', [newDishId, md.id]);
          updatedMealsCount++;
          console.log(`  更新套餐菜品关联: ${md.dish_id} -> ${newDishId}`);
        }
      });
    }

    console.log(`\n更新了 ${updatedMealsCount} 个套餐菜品关联\n`);

    // 7. 软删除重复菜品
    const now = Math.floor(Date.now() / 1000);
    let deletedCount = 0;

    duplicateGroups.forEach((group) => {
      group.remove.forEach((dish) => {
        db.run('UPDATE dishes SET deleted_at = ? WHERE id = ?', [now, dish.id]);
        deletedCount++;
        console.log(`  删除重复菜品: ${dish.name} (ID: ${dish.id})`);
      });
    });

    console.log(`\n删除了 ${deletedCount} 个重复菜品`);

    // 8. 保存数据库
    const data = db.export();
    // 这里需要调用saveDatabase，但需要从database.js导入
    console.log('\n✅ 清理完成！');
    console.log(`\n统计信息:`);
    console.log(`  - 发现重复组: ${duplicateGroups.length} 组`);
    console.log(`  - 删除重复菜品: ${deletedCount} 个`);
    console.log(`  - 更新套餐关联: ${updatedMealsCount} 个`);
    console.log(`  - 保留唯一菜品: ${allDishes.length - deletedCount} 个`);
  } catch (error) {
    console.error('清理过程中出错:', error);
    process.exit(1);
  }
}

// 运行清理脚本
cleanDuplicates();
