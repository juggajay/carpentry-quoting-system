import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.mCPConnection.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching MCP connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP connections' },
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
    const { name, type, config } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Check if a connection of this type already exists
    const existingConnection = await prisma.mCPConnection.findFirst({
      where: { type, status: 'active' }
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: `An active ${type} MCP connection already exists` },
        { status: 400 }
      );
    }

    const connection = await prisma.mCPConnection.create({
      data: {
        name,
        type,
        config: config || {},
        status: 'active'
      }
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error('Error creating MCP connection:', error);
    return NextResponse.json(
      { error: 'Failed to create MCP connection' },
      { status: 500 }
    );
  }
}