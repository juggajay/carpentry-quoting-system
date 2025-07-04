"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { FileStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function prepareUpload(fileName: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create file record in database
    const file = await prisma.uploadedFile.create({
      data: {
        fileName,
        fileSize: 0, // Will be updated after upload
        fileUrl: "", // Will be updated after upload
        status: FileStatus.UPLOADING,
        userId: user.id,
      },
    });

    // Generate signed upload URL
    const filePath = `quotes/${user.id}/${file.id}/${fileName}`;
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    return {
      success: true,
      fileId: file.id,
      uploadUrl: data.signedUrl,
      filePath,
    };
  } catch (error) {
    console.error("prepareUpload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to prepare upload",
    };
  }
}

export async function updateFileAfterUpload(
  fileId: string,
  fileSize: number,
  filePath: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get public URL for the file
    const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);

    // Update file record
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        fileSize,
        fileUrl: data.publicUrl,
        status: FileStatus.PROCESSING,
      },
    });

    revalidatePath("/import");
    return { success: true };
  } catch (error) {
    console.error("updateFileAfterUpload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update file",
    };
  }
}

export async function processUploadedPdf(fileId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get file from database
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: { user: true },
    });

    if (!file || file.user.clerkId !== userId) {
      throw new Error("File not found");
    }

    // Import Tesseract dynamically (since it's a client-side library)
    // For server-side OCR, we would typically use a service or API
    // For this implementation, we'll use the parser to extract from text
    
    // In a production environment, you would:
    // 1. Download the PDF from Supabase
    // 2. Convert PDF to images
    // 3. Run OCR on each page
    // 4. Combine results
    
    // For now, let's simulate with a realistic example
    const sampleOcrText = `
      CARPENTER PRO SUPPLIES
      123 Wood Street, Craftville, CA 90210
      Phone: (555) 123-4567
      
      QUOTATION #Q-2024-0145
      Date: March 15, 2024
      
      Bill To:
      John's Construction Co.
      456 Builder Lane
      Constructown, CA 90211
      
      MATERIALS QUOTE
      
      Item Description                    Qty    Unit    Unit Price    Total
      -------------------------------------------------------------------------
      2x4 Lumber - 8ft Premium Grade      50     pieces  $8.99         $449.50
      2x6 Lumber - 10ft                   30     pieces  $14.75        $442.50
      Plywood Sheet - 4x8 3/4"            20     sheets  $45.00        $900.00
      Drywall Sheet - 4x8 1/2"            40     sheets  $12.50        $500.00
      Wood Screws - 3" Box                10     boxes   $8.95         $89.50
      Construction Adhesive               15     tubes   $4.99         $74.85
      Insulation R-13 - 15" x 40'         8      rolls   $35.00        $280.00
      
      Subtotal:                                                         $2,736.35
      Tax (8.25%):                                                      $225.75
      Total:                                                            $2,962.10
      
      Terms: Net 30 days
      Valid until: April 15, 2024
    `;

    // Parse the OCR text
    const { QuoteParser } = await import("@/lib/ocr/parser");
    const parseResult = QuoteParser.parse(sampleOcrText);

    // Update file with extracted data
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        status: FileStatus.PENDING_VERIFICATION,
        ocrResult: {
          text: sampleOcrText,
          confidence: parseResult.confidence,
          metadata: parseResult.metadata,
        },
        extractedItems: parseResult.items,
      },
    });

    revalidatePath("/import");
    return { success: true };
  } catch (error) {
    console.error("processUploadedPdf error:", error);
    
    // Update file status to failed
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: {
        status: FileStatus.FAILED,
        processingError: error instanceof Error ? error.message : "Processing failed",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process PDF",
    };
  }
}

export async function getUploadedFiles() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) return [];

    const files = await prisma.uploadedFile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return files;
  } catch (error) {
    console.error("getUploadedFiles error:", error);
    return [];
  }
}

export async function deleteUploadedFile(fileId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: { user: true },
    });

    if (!file || file.user.clerkId !== userId) {
      throw new Error("File not found");
    }

    // Delete from storage
    const filePath = new URL(file.fileUrl).pathname.split("/").slice(-4).join("/");
    await supabase.storage.from("uploads").remove([filePath]);

    // Delete from database
    await prisma.uploadedFile.delete({
      where: { id: fileId },
    });

    revalidatePath("/import");
    return { success: true };
  } catch (error) {
    console.error("deleteUploadedFile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

export async function saveVerifiedData(
  fileId: string,
  items: any[],
  clientInfo: { name: string; email?: string; phone?: string }
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) throw new Error("User not found");

    // Verify file ownership
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId, userId: user.id },
    });

    if (!file) throw new Error("File not found");

    // Use transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Create or find client
      let client = await tx.client.findFirst({
        where: {
          userId: user.id,
          OR: [
            { email: clientInfo.email || undefined },
            { name: clientInfo.name },
          ],
        },
      });

      if (!client) {
        client = await tx.client.create({
          data: {
            name: clientInfo.name,
            email: clientInfo.email,
            phone: clientInfo.phone,
            userId: user.id,
          },
        });
      }

      // Generate quote number
      const quoteCount = await tx.quote.count({
        where: { userId: user.id },
      });
      const quoteNumber = `Q-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, "0")}`;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const tax = subtotal * 0.0825;
      const total = subtotal + tax;

      // Create quote
      const quote = await tx.quote.create({
        data: {
          quoteNumber,
          title: `Imported Quote - ${new Date().toLocaleDateString()}`,
          description: `Imported from ${file.fileName}`,
          subtotal,
          tax,
          total,
          clientId: client.id,
          userId: user.id,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Create quote items
      const quoteItems = items.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
        sortOrder: index,
        quoteId: quote.id,
      }));

      await tx.quoteItem.createMany({
        data: quoteItems,
      });

      // Update file status
      await tx.uploadedFile.update({
        where: { id: fileId },
        data: { status: FileStatus.VERIFIED },
      });

      return quote;
    });

    revalidatePath("/quotes");
    revalidatePath("/import");
    
    return { success: true, quoteId: result.id };
  } catch (error) {
    console.error("saveVerifiedData error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save data",
    };
  }
}