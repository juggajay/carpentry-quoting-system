/**
 * Test script to verify Senior Estimator API integration
 * Run with: node test-senior-estimator-integration.js
 */

const testScope = `
Supply and install new kitchen including:
- Remove existing kitchen
- Supply and install 3m of base cabinets
- Supply and install 2.4m of overhead cabinets  
- Supply and install laminate benchtop
- Install new sink and tapware
- Electrical work for appliances
- Painting of kitchen area

Bathroom renovation:
- Demolish existing bathroom
- Waterproofing to floors and walls
- Supply and install new vanity 900mm
- Install new toilet suite
- Install shower screen 900x900
- Tiling to floors and walls approx 15m2
- Plumbing and electrical work
`;

async function testChatEndpoint() {
  console.log('Testing Senior Estimator Chat API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/senior-estimator/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testScope,
        projectType: 'residential',
        location: 'NSW, Australia'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log('\n📊 Analysis Summary:');
    console.log(`- Session ID: ${data.sessionId}`);
    console.log(`- Analysis ID: ${data.analysisId}`);
    console.log(`- Scope items found: ${data.result.scope_analysis.extractedItems.length}`);
    console.log(`- Quote items generated: ${data.result.quote_items.length}`);
    console.log(`- Overall confidence: ${data.result.confidence_summary.overall_confidence.score}%`);
    console.log(`- Questions generated: ${data.result.questions.length}`);
    console.log(`- Should proceed: ${data.result.should_proceed}`);
    console.log(`- Estimated duration: ${data.result.estimated_duration}`);
    
    console.log('\n📋 Extracted Scope Items:');
    data.result.scope_analysis.extractedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.description} (${item.confidence.score}% confidence)`);
    });
    
    console.log('\n💰 Quote Items:');
    data.result.quote_items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.description}`);
      console.log(`   Quantity: ${item.quantity} ${item.unit}`);
      console.log(`   Confidence: ${item.confidence.level} (${item.confidence.score}%)`);
    });
    
    if (data.result.questions.length > 0) {
      console.log('\n❓ Questions:');
      data.result.questions.slice(0, 5).forEach((q, index) => {
        console.log(`${index + 1}. [${q.priority}] ${q.question}`);
      });
    }
    
    console.log('\n📝 Next Steps:');
    data.result.next_steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting Senior Estimator Integration Test\n');
testChatEndpoint();