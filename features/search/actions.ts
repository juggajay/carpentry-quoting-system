"use server";

import { db } from "@/lib/db";

import { auth } from "@clerk/nextjs/server";


export async function exportSearchResults(filters: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) throw new Error("User not found");

    // Build where clause (same as search API)
    const where: any = {
      createdById: user.id,
    };

    if (filters.search) {
      where.OR = [
        { quoteNumber: { contains: filters.search } },
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
        { client: { email: { contains: filters.search } } },
        { client: { company: { contains: filters.search } } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.minAmount || filters.maxAmount) {
      where.total = {};
      if (filters.minAmount) {
        where.total.gte = filters.minAmount;
      }
      if (filters.maxAmount) {
        where.total.lte = filters.maxAmount;
      }
    }

    // Fetch all matching quotes
    const quotes = await db.quote.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV
    const headers = [
      "Quote Number",
      "Date",
      "Client",
      "Email",
      "Phone",
      "Company",
      "Status",
      "Items",
      "Subtotal",
      "Tax",
      "Total",
      "Valid Until",
    ];

    const rows = quotes.map((quote) => [
      quote.quoteNumber,
      new Date(quote.createdAt).toLocaleDateString(),
      quote.client?.name || "No client",
      quote.client?.email || "",
      quote.client?.phone || "",
      quote.client?.company || "",
      quote.status,
      quote.items.length.toString(),
      quote.subtotal.toFixed(2),
      quote.tax.toFixed(2),
      quote.total.toFixed(2),
      quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "",
    ]);

    // Add items detail section
    const itemHeaders = [
      "",
      "",
      "Item Description",
      "Quantity",
      "Unit",
      "Unit Price",
      "Total",
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      "",
      "DETAILED LINE ITEMS",
      itemHeaders.join(","),
    ];

    // Add line items for each quote
    quotes.forEach((quote) => {
      csvContent.push(`"${quote.quoteNumber}"`);
      quote.items.forEach((item) => {
        csvContent.push(
          [
            "",
            "",
            `"${item.description}"`,
            item.quantity,
            `"${item.unit}"`,
            item.unitPrice.toFixed(2),
            item.total.toFixed(2),
          ].join(",")
        );
      });
      csvContent.push("");
    });

    const csv = csvContent.join("\n");
    const fileName = `quotes-export-${new Date().toISOString().split("T")[0]}.csv`;

    return {
      success: true,
      csv,
      fileName,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}