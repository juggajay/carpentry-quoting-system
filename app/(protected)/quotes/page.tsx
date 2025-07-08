import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RetryButton } from "@/components/ui/RetryButton";
import PageContainer from "@/components/layout/PageContainer";
import ContentCard from "@/components/layout/ContentCard";

async function getQuotes() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) return [];

    const quotes = await db.quote.findMany({
      where: { userId: user.id },
      include: {
        client: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return quotes;
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return null;
  }
}

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  const quotes = await getQuotes();

  if (quotes === null) {
    return (
      <PageContainer title="Quotes">
        <ContentCard className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Unable to Load Quotes</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              We&apos;re having trouble connecting to the database. Please check your connection and try again.
            </p>
            <RetryButton className="mt-4" />
          </div>
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Quotes"
      description="Manage and view all your quotes"
      actions={
        <Link href="/quotes/new">
          <Button>
            + New Quote
          </Button>
        </Link>
      }
    >

      {quotes.length === 0 ? (
        <ContentCard>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 bg-dark-surface rounded-full flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <p className="text-white font-medium mb-1">No quotes yet</p>
                <p className="text-gray-400 text-sm mb-4">
                  Get started by importing a PDF or creating a new quote
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/import">
                  <Button variant="secondary">Import PDF</Button>
                </Link>
                <Link href="/quotes/new">
                  <Button variant="primary">Create Quote</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </ContentCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => (
            <Card key={quote.id} hover>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{quote.quoteNumber}</CardTitle>
                    <CardDescription>{quote.client?.name || "No client"}</CardDescription>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      quote.status === "DRAFT"
                        ? "bg-slate-600/20 text-slate-400"
                        : quote.status === "SENT"
                        ? "bg-amber-500/20 text-amber-500"
                        : quote.status === "ACCEPTED"
                        ? "bg-lime-green/20 text-lime-green"
                        : "bg-red-600/20 text-red-600"
                    }`}
                  >
                    {quote.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-400">{quote.title}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Items:</span>
                    <span className="text-white">{quote._count.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Total:</span>
                    <span className="text-lg font-semibold text-white">
                      ${quote.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                  <span className="text-xs text-slate-400">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/quotes/${quote.id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}