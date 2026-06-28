const XLSX = require('xlsx');

const getColWidths = (data, headers) =>
  headers.map(h => ({ wch: Math.max(h.length, ...data.map(r => String(r[h] ?? '').length)) + 2 }));

const buildXlsxBuffer = (data, headers, sheetName = 'Sheet1') => {
    // 1. Create Worksheet from JSON data (array of objects)
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });

    // 2. Set Column Widths
    ws['!cols'] = getColWidths(data, headers);

    // 3. Freeze top row (headers)
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' }];

    // 4. Create Workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 5. Generate Buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
    getColWidths,
    buildXlsxBuffer
};
