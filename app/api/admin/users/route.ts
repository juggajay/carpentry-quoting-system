import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Check if user has permission to manage users
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser || (!currentUser.canManageUsers && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN')) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get all users
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}