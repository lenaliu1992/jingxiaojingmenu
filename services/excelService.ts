import { Dish, MealPlanAnalysis, ImportResult, ImportError, ImportWarning, MealPlan } from '../types';
import * as XLSX from 'xlsx';

// Excel 行数据接口
interface ExcelRow {
  套餐名称: string;
  菜品名称: string;
  菜品单价: string;
  菜品成本: string;
  数量: number;
  菜品小计: string;
  套餐原价: string;
  秒杀价1: string;
  秒杀毛利率1: string;
  秒杀价2: string;
  秒杀毛利率2: string;
}

/**
 * 将套餐数据转换为 Excel 行数据
 * 每个菜品占一行，套餐信息在所有行中重复（后续会合并单元格）
 */
const transformMealsToExcelRows = (
  meals: MealPlanAnalysis[],
  dishes: Dish[]
): ExcelRow[] => {
  const rows: ExcelRow[] = [];

  meals.forEach(meal => {
    // 统计菜品数量
    const dishCounts = meal.dishIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 为每个唯一菜品创建一行
    Object.entries(dishCounts).forEach(([dishId, quantity]) => {
      const dish = dishes.find(d => d.id === dishId);
      if (!dish) return;

      const subtotal = (dish.price || 0) * quantity;

      rows.push({
        套餐名称: meal.name,
        菜品名称: dish.name,
        菜品单价: dish.price ? `¥${dish.price.toFixed(2)}` : '-',
        菜品成本: `¥${dish.cost.toFixed(2)}`,
        数量: quantity,
        菜品小计: `¥${subtotal.toFixed(2)}`,
        套餐原价: `¥${meal.totalOriginalPrice.toFixed(2)}`,
        秒杀价1: `¥${meal.promoPrice1.toFixed(2)}`,
        秒杀毛利率1: `${meal.promoMargin1.toFixed(2)}%`,
        秒杀价2: `¥${meal.promoPrice2.toFixed(2)}`,
        秒杀毛利率2: `${meal.promoMargin2.toFixed(2)}%`,
      });
    });
  });

  return rows;
};

/**
 * 导出套餐菜品明细到 Excel
 * 每个菜品占一行，套餐信息使用合并单元格展示
 */
export const exportToExcel = (meals: MealPlanAnalysis[], dishes: Dish[]) => {
  // 1. 数据转换：将套餐数据转换为扁平化的行数据
  const rows = transformMealsToExcelRows(meals, dishes);

  // 2. 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 3. 计算并应用合并单元格
  const merges: XLSX.Range[] = [];
  let currentRowIndex = 1; // 从第1行开始（第0行是表头）

  // 按套餐分组处理
  let i = 0;
  while (i < rows.length) {
    const currentMealName = rows[i].套餐名称;
    let startRow = currentRowIndex;
    let mealRowCount = 0;

    // 统计当前套餐的行数
    while (i < rows.length && rows[i].套餐名称 === currentMealName) {
      mealRowCount++;
      i++;
    }

    // 如果套餐有多于1个菜品，则合并单元格
    if (mealRowCount > 1) {
      const endRow = startRow + mealRowCount - 1;

      // 需要合并的列索引：
      // 0-套餐名称, 6-套餐原价, 7-秒杀价1, 8-毛利率1, 9-秒杀价2, 10-毛利率2
      const columnsToMerge = [0, 6, 7, 8, 9, 10];

      columnsToMerge.forEach(colIndex => {
        merges.push({
          s: { r: startRow, c: colIndex },
          e: { r: endRow, c: colIndex }
        });
      });
    }

    currentRowIndex += mealRowCount;
  }

  // 应用合并配置到工作表
  worksheet['!merges'] = merges;

  // 4. 设置列宽
  const wscols = [
    { wch: 20 }, // 套餐名称
    { wch: 25 }, // 菜品名称
    { wch: 12 }, // 菜品单价
    { wch: 12 }, // 菜品成本
    { wch: 8 },  // 数量
    { wch: 12 }, // 菜品小计
    { wch: 12 }, // 套餐原价
    { wch: 12 }, // 秒杀价1
    { wch: 12 }, // 毛利率1
    { wch: 12 }, // 秒杀价2
    { wch: 12 }, // 毛利率2
  ];
  worksheet['!cols'] = wscols;

  // 5. 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "套餐菜品明细");

  // 6. 生成文件名（使用日期）
  const date = new Date().toISOString().split('T')[0];

  // 7. 导出文件
  XLSX.writeFile(workbook, `菜品毛利分析_${date}.xlsx`);
};

// ==================== 导入功能 ====================

/**
 * 处理合并单元格 - 填充空白的套餐信息
 * XLSX 解析时，合并单元格的值只在第一个单元格中，其余为空
 */
const fillMergedCells = (rows: any[]): any[] => {
  const result: any[] = [];
  let currentMealInfo: Partial<any> = {};

  rows.forEach((row) => {
    // 如果套餐名称为空，说明是合并单元格，使用上一行的套餐信息
    if (!row.套餐名称 || row.套餐名称.trim() === '') {
      row.套餐名称 = currentMealInfo.套餐名称 || '';
      row.套餐原价 = currentMealInfo.套餐原价 || 0;
      row.秒杀价1 = currentMealInfo.秒杀价1 || 0;
      row.秒杀毛利率1 = currentMealInfo.秒杀毛利率1 || 0;
      row.秒杀价2 = currentMealInfo.秒杀价2 || 0;
      row.秒杀毛利率2 = currentMealInfo.秒杀毛利率2 || 0;
    } else {
      // 新套餐，更新当前套餐信息
      currentMealInfo = {
        套餐名称: row.套餐名称,
        套餐原价: row.套餐原价,
        秒杀价1: row.秒杀价1,
        秒杀毛利率1: row.秒杀毛利率1,
        秒杀价2: row.秒杀价2,
        秒杀毛利率2: row.秒杀毛利率2,
      };
    }
    result.push(row);
  });

  return result;
};

/**
 * 清洗数据 - 解析价格字段
 * 支持带 ¥ 符号的字符串和数字
 */
const parsePrice = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[¥\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * 按套餐分组
 */
const groupByMeal = (rows: any[]): Map<string, any[]> => {
  const groups = new Map<string, any[]>();
  rows.forEach(row => {
    if (!row.套餐名称) return;
    if (!groups.has(row.套餐名称)) {
      groups.set(row.套餐名称, []);
    }
    groups.get(row.套餐名称)!.push(row);
  });
  return groups;
};

/**
 * 从 Excel 文件导入套餐数据
 * @param file Excel 文件对象
 * @param dishes 现有菜品库（用于匹配）
 * @returns 导入结果
 */
export const importFromExcel = async (
  file: File,
  dishes: Dish[]
): Promise<ImportResult> => {
  try {
    // 1. 读取文件
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        meals: [],
        errors: [{ type: 'INVALID_DATA', message: 'Excel 文件中没有工作表' }],
        warnings: [],
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return {
        success: false,
        meals: [],
        errors: [{ type: 'INVALID_DATA', message: '工作表中没有数据' }],
        warnings: [],
      };
    }

    // 2. 处理合并单元格
    const filledRows = fillMergedCells(rawData);

    // 3. 按套餐分组
    const mealGroups = groupByMeal(filledRows);

    // 4. 构建套餐数据
    const meals: Omit<MealPlan, 'id'>[] = [];
    const allErrors: ImportError[] = [];
    const allWarnings: ImportWarning[] = [];

    mealGroups.forEach((rows, mealName) => {
      const errors: ImportError[] = [];
      const warnings: ImportWarning[] = [];
      const dishIds: string[] = [];

      // 使用第一行的价格信息
      const firstRow = rows[0];
      const promoPrice1 = parsePrice(firstRow.秒杀价1);
      const promoPrice2 = parsePrice(firstRow.秒杀价2);
      const standardPrice = parsePrice(firstRow.套餐原价);

      // 验证必需字段
      if (!mealName || !promoPrice1) {
        allErrors.push({
          type: 'MISSING_REQUIRED_FIELD',
          mealName,
          message: `套餐缺少必需字段：套餐名称或秒杀价1`,
        });
        return;
      }

      // 处理每个菜品
      rows.forEach((row, rowIndex) => {
        const dishName = String(row.菜品名称 || '').trim();
        const quantity = parseInt(String(row.数量)) || 1;

        if (!dishName) return;

        // 查找匹配的菜品
        const matchedDish = dishes.find(d => d.name === dishName);

        if (!matchedDish) {
          errors.push({
            type: 'MISSING_DISH',
            mealName,
            dishName,
            message: `菜品库中未找到菜品: ${dishName}`,
            row: rowIndex + 2,
          });
          return;
        }

        // 可选：验证价格和成本（仅警告）
        const dishPrice = parsePrice(row.菜品单价);
        const dishCost = parsePrice(row.菜品成本);

        if (dishPrice > 0 && matchedDish.price && Math.abs(dishPrice - matchedDish.price) > 0.01) {
          warnings.push({
            type: 'PRICE_MISMATCH',
            mealName,
            dishName,
            message: `菜品单价不匹配`,
            expected: matchedDish.price,
            actual: dishPrice,
          });
        }

        if (dishCost > 0 && Math.abs(dishCost - matchedDish.cost) > 0.01) {
          warnings.push({
            type: 'COST_MISMATCH',
            mealName,
            dishName,
            message: `菜品成本不匹配`,
            expected: matchedDish.cost,
            actual: dishCost,
          });
        }

        // 根据数量生成重复的菜品 ID
        for (let i = 0; i < quantity; i++) {
          dishIds.push(matchedDish.id);
        }
      });

      if (errors.length > 0) {
        allErrors.push(...errors);
        return;
      }

      if (dishIds.length === 0) {
        allErrors.push({
          type: 'INVALID_DATA',
          mealName,
          message: `套餐没有有效的菜品`,
        });
        return;
      }

      allWarnings.push(...warnings);

      // 创建套餐
      meals.push({
        name: mealName,
        dishIds,
        standardPrice,
        promoPrice1,
        promoPrice2,
      });
    });

    // 5. 返回结果
    return {
      success: allErrors.length === 0,
      meals,
      errors: allErrors,
      warnings: allWarnings,
    };
  } catch (error) {
    return {
      success: false,
      meals: [],
      errors: [{
        type: 'INVALID_DATA',
        message: `文件解析错误: ${error instanceof Error ? error.message : '未知错误'}`,
      }],
      warnings: [],
    };
  }
};
