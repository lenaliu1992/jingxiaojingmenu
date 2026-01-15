import { Dish, MealPlanAnalysis } from '../types';
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
