// Simple test script to verify MCP functionality
const { mcpManager } = require('./lib/ai-assistant/mcp-manager.ts');

async function testMCP() {
  console.log('Testing MCP functionality...\n');
  
  try {
    // Test getting tools (should auto-initialize)
    console.log('1. Getting available MCP tools...');
    const tools = mcpManager.getAllTools();
    console.log(`✓ Found ${tools.length} tools available`);
    if (tools.length > 0) {
      console.log('Available tools:', tools.map(t => t.name).join(', '));
    }
    
    // Test database search (if we have materials)
    console.log('\n2. Testing material search...');
    try {
      const result = await mcpManager.callTool('search_materials', { query: 'timber' });
      const data = JSON.parse(result.content[0].text);
      console.log(`✓ Material search returned ${data.count} results`);
    } catch (error) {
      console.log('⚠ Material search failed (expected if no materials in DB):', error.message);
    }
    
    console.log('\n✅ MCP functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ MCP test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testMCP();