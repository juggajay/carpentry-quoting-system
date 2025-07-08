import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(userId);
    
    // Ensure user exists in our database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: currentUser.emailAddresses[0]?.emailAddress || "",
        firstName: currentUser.firstName || null,
        lastName: currentUser.lastName || null,
      },
      create: {
        clerkId: userId,
        email: currentUser.emailAddresses[0]?.emailAddress || "",
        firstName: currentUser.firstName || null,
        lastName: currentUser.lastName || null,
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