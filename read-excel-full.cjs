const XLSX = require('xlsx');
const fs = require('fs');

const filePath = './成本卡1.16.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log('总行数:', data.length);
  console.log('\n========== 所有菜品数据 ==========\n');

  const dishes = [];
  data.forEach((row, idx) => {
    if (idx === 0) return; // 跳过表头

    const [name, price, cost, margin] = row;
    if (name && price !== undefined && cost !== undefined) {
      dishes.push({
        name,
        price: Number(price),
        cost: Number(cost),
        margin: margin !== undefined ? Number(margin) : undefined
      });
    }
  });

  console.log(`找到 ${dishes.length} 个菜品:\n`);
  dishes.forEach((dish, idx) => {
    console.log(`${idx + 1}. ${dish.name} - 售价: ¥${dish.price}, 成本: ¥${dish.cost}${dish.margin ? `, 毛利率: ${(dish.margin * 100).toFixed(1)}%` : ''}`);
  });

  // 保存到 JSON 文件以便查看
  fs.writeFileSync('./dishes-from-excel.json', JSON.stringify(dishes, null, 2));
  console.log('\n已保存到 dishes-from-excel.json');

} catch (error) {
  console.error('读取失败:', error.message);
}
