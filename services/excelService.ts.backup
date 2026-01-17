import { Dish, MealPlanAnalysis } from '../types';
import * as XLSX from 'xlsx';

export const exportToExcel = (meals: MealPlanAnalysis[], dishes: Dish[]) => {
  // 1. Prepare Data for the main sheet
  const data = meals.map(meal => {
    // Count quantities for dishes
    const dishCounts = meal.dishIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Format dish details string: "DishName(Price) xQty"
    const dishDetails = Object.entries(dishCounts)
      .map(([id, count]) => {
        const dish = dishes.find(d => d.id === id);
        if (!dish) return '未知菜品';
        const priceStr = dish.price ? `¥${dish.price}` : '-';
        return count > 1 
          ? `${dish.name}(${priceStr}) x${count}`
          : `${dish.name}(${priceStr})`;
      })
      .join(', ');

    return {
      "套餐名称": meal.name,
      "包含菜品": dishDetails,
      "套餐原价": `¥${meal.totalOriginalPrice.toFixed(2)}`,
      "总成本": `¥${meal.totalCost.toFixed(2)}`,
      
      // Removed Standard Price/Profit/Margin as requested
      // Removed Flash Sale Profit as requested
      
      "秒杀价1": `¥${meal.promoPrice1.toFixed(2)}`,
      "秒杀毛利率1": `${meal.promoMargin1.toFixed(2)}%`,
      
      "秒杀价2": `¥${meal.promoPrice2.toFixed(2)}`,
      "秒杀毛利率2": `${meal.promoMargin2.toFixed(2)}%`,
    };
  });

  // 2. Create Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 3. Auto-width calculations (rough estimate)
  const wscols = [
    { wch: 20 }, // Name
    { wch: 60 }, // Dishes
    { wch: 15 }, // Original Value
    { wch: 12 }, // Cost
    { wch: 15 }, // Flash 1
    { wch: 15 }, 
    { wch: 15 }, // Flash 2
    { wch: 15 }, 
  ];
  worksheet['!cols'] = wscols;

  // 4. Create Workbook and Append Sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Analysis");

  // 5. Generate file name with timestamp
  const date = new Date().toISOString().split('T')[0];
  
  // 6. Write file
  XLSX.writeFile(workbook, `Menu_Pricing_Analysis_${date}.xlsx`);
};