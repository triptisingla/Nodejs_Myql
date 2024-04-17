const xlsx = require('xlsx');

exports.readExcelData = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error('Error reading Excel data:', error);
    throw new Error('Error reading Excel data');
  }
};
