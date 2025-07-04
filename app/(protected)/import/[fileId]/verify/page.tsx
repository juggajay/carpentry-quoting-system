import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import VerificationLayout from "./verification-layout";

const prisma = new PrismaClient();

interface ExtractedItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const resolvedParams = await params;
  const { userId } = await auth();
  if (!userId) return notFound();

  // Get user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) return notFound();

  // Get file
  const file = await prisma.uploadedFile.findUnique({
    where: { 
      id: resolvedParams.fileId,
      userId: user.id,
    },
  });

  if (!file || file.status !== "PENDING_VERIFICATION") {
    return notFound();
  }

  // Parse extracted items
  const extractedItems = Array.isArray(file.extractedItems) 
    ? file.extractedItems as ExtractedItem[]
    : [];

  return (
    <VerificationLayout
      file={file}
      extractedItems={extractedItems}
    />
  );
}