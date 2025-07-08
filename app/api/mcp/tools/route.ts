import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { mcpManager } from '@/lib/ai-assistant/mcp-manager';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tools = mcpManager.getAllTools();
    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toolName, args, connectionId } = body;

    if (!toolName) {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      );
    }

    const result = await mcpManager.callTool(toolName, args || {}, connectionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling MCP tool:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to call MCP tool' },
      { status: 500 }
    );
  }
}