import { Dish, MealPlanAnalysis, ImportResult, ImportError, ImportWarning, MealPlan } from '../types';
import * as XLSX from 'xlsx';

// Excel 行数据接口（基础类型，不包含秒杀价2）
interface ExcelRowBase {
  套餐名称: string;
  菜品名称: string;
  菜品单价: string;
  菜品成本: string;
  数量: number;
  菜品小计: string;
  套餐原价: string;
  秒杀价1: string;
  秒杀毛利率1: string;
}

// Excel 行数据接口（包含秒杀价2）
interface ExcelRowWithPromo2 extends ExcelRowBase {
  秒杀价2: string;
  秒杀毛利率2: string;
}

// Excel 行数据类型（联合类型）
type ExcelRow = ExcelRowBase | ExcelRowWithPromo2;

/**
 * 将套餐数据转换为 Excel 行数据
 * 每个菜品占一行，套餐信息在所有行中重复（后续会合并单元格）
 * 动态判断是否包含秒杀价2列
 */
const transformMealsToExcelRows = (
  meals: MealPlanAnalysis[],
  dishes: Dish[]
): ExcelRow[] => {
  const rows: ExcelRow[] = [];

  // 判断是否需要包含秒杀价2列（只要有任何一个套餐设置了秒杀价2）
  const hasAnyPromoPrice2 = meals.some(m => m.promoPrice2 !== undefined);

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

      // 基础行数据 - 添加 null 检查
      const baseRow: ExcelRowBase = {
        套餐名称: meal.name,
        菜品名称: dish.name,
        菜品单价: dish.price ? `¥${dish.price.toFixed(2)}` : '-',
        菜品成本: `¥${(dish.cost || 0).toFixed(2)}`,
        数量: quantity,
        菜品小计: `¥${subtotal.toFixed(2)}`,
        套餐原价: `¥${(meal.totalOriginalPrice || 0).toFixed(2)}`,
        秒杀价1: `¥${(meal.promoPrice1 || 0).toFixed(2)}`,
        秒杀毛利率1: `${(meal.promoMargin1 || 0).toFixed(2)}%`,
      };

      // 根据是否需要秒杀价2来决定添加哪些字段
      if (hasAnyPromoPrice2) {
        rows.push({
          ...baseRow,
          秒杀价2: meal.promoPrice2 !== undefined && meal.promoPrice2 !== null
            ? `¥${meal.promoPrice2.toFixed(2)}`
            : '-',
          秒杀毛利率2: meal.promoPrice2 !== undefined && meal.promoPrice2 !== null && meal.promoMargin2 !== undefined && meal.promoMargin2 !== null
            ? `${meal.promoMargin2.toFixed(2)}%`
            : '-',
        } as ExcelRowWithPromo2);
      } else {
        rows.push(baseRow);
      }
    });
  });

  return rows;
};

/**
 * 导出套餐菜品明细到 Excel
 * 每个菜品占一行，套餐信息使用合并单元格展示
 * 动态判断是否包含秒杀价2列
 */
export const exportToExcel = (meals: MealPlanAnalysis[], dishes: Dish[]) => {
  console.log('开始导出 Excel...', { mealCount: meals.length, dishCount: dishes.length });

  // 1. 数据转换：将套餐数据转换为扁平化的行数据
  const rows = transformMealsToExcelRows(meals, dishes);
  console.log('转换后的行数据:', rows);

  // 2. 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 3. 判断是否需要包含秒杀价2列
  const hasAnyPromoPrice2 = meals.some(m => m.promoPrice2 !== undefined);

  // 4. 计算并应用合并单元格
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

      // 根据是否有秒杀价2来决定要合并的列索引
      // 0-套餐名称, 6-套餐原价, 7-秒杀价1, 8-毛利率1
      // 如果有秒杀价2：9-秒杀价2, 10-毛利率2
      const columnsToMerge = hasAnyPromoPrice2
        ? [0, 6, 7, 8, 9, 10]
        : [0, 6, 7, 8];

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

  // 5. 设置列宽（动态调整）
  const wscols = hasAnyPromoPrice2
    ? [
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
      ]
    : [
        { wch: 20 }, // 套餐名称
        { wch: 25 }, // 菜品名称
        { wch: 12 }, // 菜品单价
        { wch: 12 }, // 菜品成本
        { wch: 8 },  // 数量
        { wch: 12 }, // 菜品小计
        { wch: 12 }, // 套餐原价
        { wch: 12 }, // 秒杀价1
        { wch: 12 }, // 毛利率1
      ];
  worksheet['!cols'] = wscols;

  // 5. 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "套餐菜品明细");

  // 6. 生成文件名（使用日期+时间戳）
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');

  // 7. 导出文件
  const fileName = `菜品毛利分析_${date}_${time}.xlsx`;
  console.log('正在导出文件:', fileName);
  XLSX.writeFile(workbook, fileName);
  console.log('导出完成!');
};

// ==================== 导入功能 ====================

/**
 * 处理合并单元格 - 填充空白的套餐信息
 * XLSX 解析时，合并单元格的值只在第一个单元格中，其余为空
 * @param rows 原始行数据
 * @param hasPromoPrice2Column 是否包含秒杀价2列
 */
const fillMergedCells = (rows: any[], hasPromoPrice2Column: boolean): any[] => {
  const result: any[] = [];
  let currentMealInfo: Partial<any> = {};

  rows.forEach((row) => {
    // 如果套餐名称为空，说明是合并单元格，使用上一行的套餐信息
    if (!row.套餐名称 || row.套餐名称.trim() === '') {
      row.套餐名称 = currentMealInfo.套餐名称 || '';
      row.套餐原价 = currentMealInfo.套餐原价 || 0;
      row.秒杀价1 = currentMealInfo.秒杀价1 || 0;
      row.秒杀毛利率1 = currentMealInfo.秒杀毛利率1 || 0;
      // 只有当Excel中有秒杀价2列时才填充
      if (hasPromoPrice2Column) {
        row.秒杀价2 = currentMealInfo.秒杀价2 || 0;
        row.秒杀毛利率2 = currentMealInfo.秒杀毛利率2 || 0;
      }
    } else {
      // 新套餐，更新当前套餐信息
      currentMealInfo = {
        套餐名称: row.套餐名称,
        套餐原价: row.套餐原价,
        秒杀价1: row.秒杀价1,
        秒杀毛利率1: row.秒杀毛利率1,
      };
      // 只有当Excel中有秒杀价2列时才记录
      if (hasPromoPrice2Column) {
        currentMealInfo.秒杀价2 = row.秒杀价2;
        currentMealInfo.秒杀毛利率2 = row.秒杀毛利率2;
      }
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

    // 2. 检测是否有秒杀价2列
    const hasPromoPrice2Column = rawData.length > 0 && '秒杀价2' in rawData[0];

    // 3. 处理合并单元格
    const filledRows = fillMergedCells(rawData, hasPromoPrice2Column);

    // 4. 按套餐分组
    const mealGroups = groupByMeal(filledRows);

    // 5. 构建套餐数据
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
      const standardPrice = parsePrice(firstRow.套餐原价);

      // 条件读取秒杀价2：只有当Excel中有这一列且值大于0时才保存
      let promoPrice2: number | undefined = undefined;
      if (hasPromoPrice2Column) {
        const parsedValue = parsePrice(firstRow.秒杀价2);
        promoPrice2 = parsedValue > 0 ? parsedValue : undefined;
      }

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

// ==================== 菜品导入功能 ====================

/**
 * 从 Excel 文件导入菜品库
 * 完全替换现有菜品库
 */
export const importDishesFromExcel = async (file: File): Promise<{
  success: boolean;
  dishes: Dish[];
  errors: string[];
}> => {
  try {
    // 1. 读取文件
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        dishes: [],
        errors: ['Excel 文件中没有工作表'],
      };
    }

    // 2. 读取第一个工作表
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length === 0) {
      return {
        success: false,
        dishes: [],
        errors: ['工作表中没有数据'],
      };
    }

    // 3. 解析菜品数据（跳过表头）
    const dishes: Dish[] = [];
    const errors: string[] = [];

    // 从第2行开始（第1行是表头）
    for (let rowIdx = 1; rowIdx < rawData.length; rowIdx++) {
      const row = rawData[rowIdx];
      const [name, price, cost] = row;

      // 跳过空行
      if (!name || name.trim() === '') {
        continue;
      }

      // 验证必需字段
      if (price === undefined || cost === undefined) {
        errors.push(`第 ${rowIdx + 1} 行: 菜品 "${name}" 缺少售价或成本`);
        continue;
      }

      // 创建菜品对象
      const dish: Dish = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        name: name.trim(),
        price: Number(price) || 0,
        cost: Number(cost) || 0,
      };

      dishes.push(dish);
    }

    // 4. 返回结果
    return {
      success: errors.length === 0 || dishes.length > 0,
      dishes,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      dishes: [],
      errors: [`文件解析错误: ${error instanceof Error ? error.message : '未知错误'}`],
    };
  }
};
