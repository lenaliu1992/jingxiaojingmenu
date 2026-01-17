const XLSX = require('xlsx');

const filePath = './成本卡 1.15.xlsx';

try {
  const workbook = XLSX.readFile(filePath);

  console.log('工作表列表:', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n========== 工作表: ${sheetName} ==========`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 显示前15行
    console.log(`总行数: ${data.length}`);
    console.log('\n前15行数据:');
    data.slice(0, 15).forEach((row, idx) => {
      console.log(`行${idx + 1}:`, row);
    });

    // 显示列名（第一行）
    if (data.length > 0) {
      console.log('\n列名:', data[0]);
    }
  });
} catch (error) {
  console.error('读取失败:', error.message);
}
