import { auth, clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const currentUser = await clerkClient.users.getUser(userId);
    
    // Ensure user exists in our database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: currentUser.emailAddresses[0]?.emailAddress || "",
        name: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || null,
      },
      create: {
        clerkId: userId,
        email: currentUser.emailAddresses[0]?.emailAddress || "",
        name: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}