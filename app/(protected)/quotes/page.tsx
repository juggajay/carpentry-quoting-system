import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import PageContainer from "@/components/layout/PageContainer";
import ContentCard from "@/components/layout/ContentCard";
import { PlusIcon, EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const prisma = new PrismaClient();

async function getQuotes() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) return [];

    const quotes = await prisma.quote.findMany({
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

export default async function QuotesPage() {
  const quotes = await getQuotes();

  if (quotes === null) {
    return (
      <PageContainer title="Quotes">
        <ContentCard className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Unable to Load Quotes</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We're having trouble connecting to the database. Please check your connection and try again.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
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
            <PlusIcon className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </Link>
      }
    >

      {quotes.length === 0 ? (
        <ContentCard>
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary mb-4">No quotes yet</p>
            <Link href="/import">
              <Button variant="secondary">Import Your First Quote</Button>
            </Link>
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
                        ? "bg-background-hover text-text-secondary"
                        : quote.status === "SENT"
                        ? "bg-info/10 text-info"
                        : quote.status === "ACCEPTED"
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {quote.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-text-secondary">{quote.title}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Items:</span>
                    <span className="text-text-primary">{quote._count.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted text-sm">Total:</span>
                    <span className="text-lg font-semibold text-text-primary">
                      ${quote.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border-default">
                  <span className="text-xs text-text-muted">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/quotes/${quote.id}`}>
                    <Button size="sm" variant="secondary">
                      <EyeIcon className="w-4 h-4 mr-1" />
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