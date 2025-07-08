import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      clerk: false,
      database: false,
      supabase: false,
    },
    errors: [] as string[],
  };

  // Check Clerk
  try {
    await auth();
    checks.checks.clerk = true;
  } catch (error) {
    checks.errors.push(`Clerk auth failed: ${error}`);
  }

  // Check Database
  try {
    await db.$connect();
    await db.$disconnect();
    checks.checks.database = true;
  } catch (error) {
    checks.errors.push(`Database connection failed: ${error}`);
  }

  // Check Supabase config
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    checks.checks.supabase = true;
  } else {
    checks.errors.push("Supabase environment variables missing");
  }

  const allHealthy = Object.values(checks.checks).every(v => v === true);
  
  return NextResponse.json(checks, { 
    status: allHealthy ? 200 : 503 
  });
}