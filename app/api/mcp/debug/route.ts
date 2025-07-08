import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { MCPManager } from '@/lib/ai-assistant/mcp-manager';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mcpManager = MCPManager.getInstance();
    const connections = mcpManager.getConnections();

    // Test each connection
    const tests = {
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        BRAVE_API_KEY: process.env.BRAVE_API_KEY ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        PWD: process.cwd()
      },
      connections: connections.map(conn => ({
        id: conn.id,
        name: conn.name,
        type: conn.type,
        status: conn.status,
        toolCount: conn.tools.length
      })),
      tests: {} as Record<string, unknown>
    };

    // Test PostgreSQL
    try {
      const result = await mcpManager.callTool('search_materials', { query: 'test', limit: 1 });
      tests.tests.postgresql = { success: true, result };
    } catch (error) {
      tests.tests.postgresql = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Test Memory
    try {
      await mcpManager.callTool('store_memory', { key: 'test_key', value: 'test_value' });
      const retrieved = await mcpManager.callTool('retrieve_memory', { key: 'test_key' });
      tests.tests.memory = { success: true, stored: 'test_value', retrieved };
    } catch (error) {
      tests.tests.memory = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    return NextResponse.json(tests);
  } catch (error) {
    console.error('MCP debug error:', error);
    return NextResponse.json(
      { error: 'Failed to debug MCP', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}