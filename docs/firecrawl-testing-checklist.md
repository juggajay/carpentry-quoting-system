# Firecrawl Integration Testing Checklist

## Setup
- [ ] Ensure FIRECRAWL_API_KEY is set in environment variables
- [ ] Start the development server
- [ ] Open Materials Management page

## Basic Scraping Tests

### 1. Scrape Bunnings Timber Category
- [ ] Click "Import from Supplier" button
- [ ] Select "Bunnings" as supplier
- [ ] Select "Timber" category
- [ ] Click "Start Scraping"
- [ ] Verify products appear in preview table
- [ ] Check that product names are cleaned (no length suffixes)
- [ ] Verify SKUs are generated for products without them

### 2. Price Parsing Accuracy
- [ ] Check prices are correctly parsed (no $ or commas)
- [ ] Verify per-unit pricing for length-based products (e.g., 2.4m timber)
- [ ] Confirm GST indicator shows "inc GST" for all products
- [ ] Test GST exclusion option removes 10% from prices

### 3. Duplicate Detection
- [ ] Run scrape for products already in database
- [ ] Verify existing products show "Existing" badge
- [ ] New products should show "New" badge
- [ ] Check summary counts are accurate

### 4. Import Flow

#### Import New Products Only
- [ ] Select only products with "New" status
- [ ] Click "Import Selected"
- [ ] Verify success message shows correct count
- [ ] Check database has new materials added
- [ ] Confirm no duplicates were created

#### Update Existing Materials
- [ ] Enable "Update Existing" option
- [ ] Select products with "Existing" status
- [ ] Import and verify prices are updated
- [ ] Check other fields (name, category) are updated
- [ ] Verify updated timestamp changes

### 5. Bulk Operations
- [ ] Use "Select All" checkbox
- [ ] Verify all valid products are selected
- [ ] Products with errors should not be selectable
- [ ] Test deselecting individual items
- [ ] Import 50+ products at once

### 6. Error Handling

#### Network Errors
- [ ] Disconnect internet during scraping
- [ ] Verify error message appears
- [ ] Check app doesn't crash
- [ ] Reconnect and retry successfully

#### Invalid Data
- [ ] Test with products missing prices
- [ ] Verify these show error status
- [ ] Check they can't be imported
- [ ] Other valid products should still work

#### Cancellation
- [ ] Start large import (100+ products)
- [ ] Navigate away mid-import
- [ ] Return and verify partial import completed
- [ ] No data corruption occurs

### 7. Category Filtering
- [ ] Scrape without category (all products)
- [ ] Scrape specific category (e.g., "Plumbing")
- [ ] Verify only relevant products appear
- [ ] Test multiple categories sequentially

### 8. Different Suppliers
- [ ] Test Bunnings scraping
- [ ] Test Tradelink scraping
- [ ] Test Reece scraping
- [ ] Verify supplier-specific parsing works
- [ ] Check unit mapping is correct for each

## AI Assistant Integration

### 9. MCP Tools Testing
- [ ] Ask AI: "Scrape timber products from Bunnings"
- [ ] Verify AI uses scrape_supplier tool
- [ ] Check results are displayed correctly
- [ ] Ask AI to import specific products
- [ ] Confirm import_materials tool works

### 10. Quote Integration
- [ ] Create quote with placeholder prices
- [ ] Ask AI: "Update this quote with current Bunnings prices"
- [ ] Verify AI scrapes and updates prices
- [ ] Check calculations remain correct
- [ ] Ensure markup is preserved

## Performance Tests

### 11. Large Dataset
- [ ] Scrape category with 100+ products
- [ ] Monitor page responsiveness
- [ ] Check memory usage doesn't spike
- [ ] Verify all products load correctly

### 12. Rate Limiting
- [ ] Perform multiple scrapes quickly
- [ ] Verify rate limiting prevents API errors
- [ ] Check delays are implemented
- [ ] Ensure retries work correctly

## Data Integrity

### 13. Database Consistency
- [ ] Check imported materials have all required fields
- [ ] Verify userId is set correctly
- [ ] Confirm timestamps are accurate
- [ ] Test database constraints aren't violated

### 14. Unit Conversion
- [ ] Import products with different units
- [ ] Verify LM, EA, SQM, KG mappings work
- [ ] Check edge cases (e.g., "per length")
- [ ] Ensure consistent unit storage

## Edge Cases

### 15. Special Characters
- [ ] Import products with special characters in names
- [ ] Test products with brackets, slashes, quotes
- [ ] Verify SKU generation handles these
- [ ] Check database storage is correct

### 16. Price Variations
- [ ] Test products with sale prices
- [ ] Import items with price ranges
- [ ] Handle "POA" (Price on Application)
- [ ] Verify $0 prices are flagged

## Cleanup
- [ ] Delete test materials from database
- [ ] Clear any error logs
- [ ] Document any issues found
- [ ] Update test cases as needed