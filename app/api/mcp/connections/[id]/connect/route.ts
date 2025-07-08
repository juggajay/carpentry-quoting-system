import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { mcpManager } from '@/lib/ai-assistant/mcp-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: connectionId } = await params;

    // Get the connection from the database
    const dbConnection = await prisma.mCPConnection.findUnique({
      where: { id: connectionId }
    });

    if (!dbConnection) {
      return NextResponse.json(
        { error: 'MCP connection not found' },
        { status: 404 }
      );
    }

    // Connect to the MCP server
    const connection = await mcpManager.connectToMCP({
      id: dbConnection.id,
      name: dbConnection.name,
      type: dbConnection.type,
      config: (dbConnection.config as Record<string, unknown>) || {}
    });

    return NextResponse.json({
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      tools: connection.tools,
      error: connection.error
    });
  } catch (error) {
    console.error('Error connecting to MCP:', error);
    return NextResponse.json(
      { error: 'Failed to connect to MCP server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: connectionId } = await params;

    // Disconnect from the MCP server
    await mcpManager.disconnectMCP(connectionId);

    return NextResponse.json({ message: 'MCP connection disconnected' });
  } catch (error) {
    console.error('Error disconnecting from MCP:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from MCP server' },
      { status: 500 }
    );
  }
}