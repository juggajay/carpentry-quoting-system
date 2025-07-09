// Test the Senior Estimator Agent functionality
const { seniorEstimatorProcessor } = require('./lib/ai-assistant/senior-estimator-processor');

async function testSeniorEstimator() {
  console.log('🧪 Testing Senior Estimator Agent...\n');
  
  // Test 1: Simple scope parsing
  console.log('Test 1: Simple scope parsing');
  const simpleScope = "Supply and install 19mm F11 structural plywood to kitchen ceiling. Area approximately 25 sqm.";
  
  try {
    const result = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: simpleScope,
      project_type: 'residential',
      location: 'NSW, Australia'
    });
    
    console.log('✅ Scope Analysis:');
    console.log(`  - ${result.scope_analysis.extractedItems.length} items extracted`);
    console.log(`  - ${result.scope_analysis.ambiguities.length} ambiguities found`);
    console.log(`  - Overall confidence: ${result.scope_analysis.confidence.score}%`);
    
    console.log('\n✅ Quote Items:');
    result.quote_items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.description}`);
      console.log(`     - Quantity: ${item.quantity} ${item.unit}`);
      console.log(`     - Confidence: ${item.confidence.score}% ${item.confidence.indicator}`);
    });
    
    console.log('\n✅ Questions Generated:');
    result.questions.forEach((question, index) => {
      console.log(`  ${index + 1}. [${question.priority}] ${question.question}`);
    });
    
    console.log(`\n✅ Should Proceed: ${result.should_proceed}`);
    console.log(`✅ Estimated Duration: ${result.estimated_duration}`);
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Complex scope with multiple items
  console.log('Test 2: Complex scope with multiple items');
  const complexScope = `
    Residential renovation project - Kitchen and bathroom:
    
    Kitchen:
    - Remove existing kitchen cabinets and benchtops
    - Install new 2400x600mm overhead cabinets (6 units)
    - Install new 900x600mm base cabinets (4 units)
    - Supply and install 40mm stone benchtop, approximately 8 linear meters
    - Install subway tile splashback, approximately 12 square meters
    
    Bathroom:
    - Remove existing tiles and fixtures
    - Install new wall tiles throughout (25 sqm)
    - Install new floor tiles (8 sqm)
    - Waterproof shower area as per AS 3740
    - Install new vanity unit 1200mm wide
  `;
  
  try {
    const result = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: complexScope,
      project_type: 'residential',
      location: 'NSW, Australia'
    });
    
    console.log('✅ Complex Scope Analysis:');
    console.log(`  - ${result.scope_analysis.extractedItems.length} items extracted`);
    console.log(`  - ${result.scope_analysis.ambiguities.length} ambiguities found`);
    console.log(`  - Completeness: ${result.scope_analysis.completeness.toFixed(1)}%`);
    
    console.log('\n✅ Confidence Summary:');
    console.log(`  - High: ${result.confidence_summary.high_confidence_items} items`);
    console.log(`  - Medium: ${result.confidence_summary.medium_confidence_items} items`);
    console.log(`  - Low: ${result.confidence_summary.low_confidence_items} items`);
    console.log(`  - Review: ${result.confidence_summary.items_requiring_review} items`);
    
    console.log('\n✅ NSW Compliance Notes:');
    if (result.scope_analysis.nsw_compliance_notes) {
      result.scope_analysis.nsw_compliance_notes.forEach(note => {
        console.log(`  - ${note}`);
      });
    }
    
    console.log('\n✅ Next Steps:');
    result.next_steps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Unusual/adaptive scope
  console.log('Test 3: Unusual/adaptive scope');
  const unusualScope = "Supply and install hemp-lime wall construction to recording studio for acoustic treatment, including specialized vapor barrier and sound dampening materials.";
  
  try {
    const result = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: unusualScope,
      project_type: 'commercial',
      location: 'NSW, Australia'
    });
    
    console.log('✅ Unusual Scope Analysis:');
    console.log(`  - ${result.scope_analysis.extractedItems.length} items extracted`);
    console.log(`  - ${result.scope_analysis.ambiguities.length} ambiguities found`);
    console.log(`  - Questions generated: ${result.questions.length}`);
    
    console.log('\n✅ Adaptive Behavior:');
    if (result.questions.length > 0) {
      console.log('  Agent correctly identified unusual materials and asked for clarification:');
      result.questions.slice(0, 2).forEach((question, index) => {
        console.log(`    ${index + 1}. ${question.question}`);
      });
    }
    
    console.log(`\n✅ Conservative Approach: ${result.should_proceed ? 'Proceeded' : 'Stopped for clarification'}`);
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
  
  console.log('\n🏁 Testing complete!\n');
}

// Run the test
testSeniorEstimator().catch(console.error);