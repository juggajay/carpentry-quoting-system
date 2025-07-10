const fs = require('fs');
const path = require('path');

// Create a test PDF file (5MB - larger than Vercel's 4.5MB limit)
const createTestPDF = () => {
  const pdfHeader = Buffer.from('%PDF-1.4\n');
  const pdfContent = Buffer.alloc(5 * 1024 * 1024 - 100); // 5MB minus some overhead
  pdfContent.fill('Test content for large PDF file. ');
  const pdfFooter = Buffer.from('\n%%EOF');
  
  const pdfBuffer = Buffer.concat([pdfHeader, pdfContent, pdfFooter]);
  const filePath = path.join(__dirname, 'test-large-file.pdf');
  
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`Created test PDF: ${filePath}`);
  console.log(`File size: ${(pdfBuffer.length / (1024 * 1024)).toFixed(2)}MB`);
  
  return filePath;
};

// Instructions for testing
console.log('\n=== Vercel Blob Upload Test ===\n');
console.log('1. First, ensure you have set up Vercel Blob Storage:');
console.log('   - Go to your Vercel dashboard');
console.log('   - Navigate to Storage > Create Database > Blob');
console.log('   - Add BLOB_READ_WRITE_TOKEN to your environment variables');
console.log('\n2. Creating a test PDF file...');

const testFile = createTestPDF();

console.log('\n3. To test the upload:');
console.log('   - Run your app: npm run dev');
console.log('   - Go to Senior Estimator page');
console.log('   - Click "Upload Large File (up to 500MB)"');
console.log(`   - Select the test file: ${testFile}`);
console.log('   - Watch the progress bar and check for success');
console.log('\n4. After upload, click "Analyze Files" to process it');
console.log('\nThe file should upload successfully and bypass the 4.5MB limit!');