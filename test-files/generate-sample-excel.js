const XLSX = require('xlsx');

// Create a new workbook
const wb = XLSX.utils.book_new();

// Sample data for Trade Breakup sheet
const tradeBreakupData = [
  ['CARPENTRY LABOUR TRADE BREAKUP'],
  [],
  ['Activity', 'Days', 'Rate/Day', 'Total'],
  ['Wall framing - 120 m2', 3, 800, 2400],
  ['Roof framing - structural', 5, 850, 4250],
  ['Floor framing - joists', 2, 800, 1600],
  ['Door installation - single doors', 1.5, 750, 1125],
  ['Window installation and trim', 2, 750, 1500],
  ['External cladding - weatherboard', 4, 800, 3200],
  ['Internal lining - plasterboard', 3, 750, 2250],
  ['Deck framing and boarding', 2.5, 800, 2000],
  [],
  ['MATERIALS QUANTITIES'],
  [],
  ['Description', 'Quantity', 'Unit', 'Rate', 'Total'],
  ['Wall framing timber', 120, 'm2', 45, 5400],
  ['Roof framing materials', 150, 'm2', 55, 8250],
  ['Floor joists', 80, 'lm', 35, 2800],
  ['Single doors', 8, 'ea', 450, 3600],
  ['Windows', 12, 'ea', 650, 7800],
  ['Weatherboard cladding', 180, 'm2', 85, 15300],
  ['Plasterboard sheets', 220, 'm2', 25, 5500],
  ['Decking boards', 45, 'm2', 120, 5400]
];

// Sample data for Labor Rates sheet
const laborRatesData = [
  ['STANDARD LABOR RATES'],
  [],
  ['Description', 'Hourly Rate', 'Daily Rate', 'Loaded Rate'],
  ['Carpenter - Level 3', '$85/hr', '$680/day', '$95/hr'],
  ['Carpenter - Level 4', '$95/hr', '$760/day', '$105/hr'],
  ['Leading Hand', '$105/hr', '$840/day', '$115/hr'],
  ['Apprentice - 3rd Year', '$55/hr', '$440/day', '$65/hr'],
  ['Team Rate (2 carpenters)', '-', '$1440/day', '-'],
  [],
  ['ACTIVITY RATES'],
  [],
  ['Activity', 'Rate', 'Unit', 'Notes'],
  ['Wall framing', '$20/m2', 'm2', 'Includes labor only'],
  ['Roof framing', '$28/m2', 'm2', 'Complex roof structures'],
  ['Door installation', '$140/ea', 'each', 'Single door, includes hardware'],
  ['Window installation', '$125/ea', 'each', 'Standard size window'],
  ['Cladding installation', '$18/m2', 'm2', 'Weatherboard or similar'],
  ['Deck construction', '$45/m2', 'm2', 'Includes framing and decking']
];

// Create worksheets
const ws1 = XLSX.utils.aoa_to_sheet(tradeBreakupData);
const ws2 = XLSX.utils.aoa_to_sheet(laborRatesData);

// Add worksheets to workbook
XLSX.utils.book_append_sheet(wb, ws1, 'Trade Breakup');
XLSX.utils.book_append_sheet(wb, ws2, 'Labor Rates');

// Write the file
XLSX.writeFile(wb, 'sample-labor-rates.xlsx');

console.log('Sample Excel file created: sample-labor-rates.xlsx');