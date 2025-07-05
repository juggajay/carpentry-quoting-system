import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import VerificationLayout from "./verification-layout";
import PageContainer from "@/components/layout/PageContainer";
import ContentCard from "@/components/layout/ContentCard";
import { RetryButton } from "@/components/ui/RetryButton";

interface ExtractedItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export const dynamic = 'force-dynamic';

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  try {
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
      ? (file.extractedItems as unknown as ExtractedItem[])
      : [];

    return (
      <VerificationLayout
        file={file}
        extractedItems={extractedItems}
      />
    );
  } catch (error) {
    console.error("Error loading file for verification:", error);
    return (
      <PageContainer title="Verify Import">
        <ContentCard className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-error/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Unable to Load File</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We encountered an error while loading the file for verification. Please try again.
            </p>
            <RetryButton className="mt-4" />
          </div>
        </ContentCard>
      </PageContainer>
    );
  }
}