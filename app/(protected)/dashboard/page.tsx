import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RetryButton } from "@/components/ui/RetryButton";
import PageContainer from "@/components/layout/PageContainer";
import ContentCard from "@/components/layout/ContentCard";
import { 
  DocumentTextIcon, 
  UsersIcon, 
  ArrowUpIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  DocumentArrowUpIcon
} from "@heroicons/react/24/outline";

async function getDashboardData() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) return null;

    // Get stats
    const [
      totalQuotes,
      acceptedQuotes,
      totalClients,
      recentQuotes,
      recentFiles,
      currentMonthQuotes,
      lastMonthQuotes,
    ] = await Promise.all([
    prisma.quote.count({ where: { userId: user.id } }),
    prisma.quote.count({ where: { userId: user.id, status: "ACCEPTED" } }),
    prisma.client.count({ where: { userId: user.id } }),
    prisma.quote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true },
    }),
    prisma.uploadedFile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Current month quotes
    prisma.quote.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().setDate(1)),
        },
      },
    }),
    // Last month quotes
    prisma.quote.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1, 1)),
          lt: new Date(new Date().setDate(1)),
        },
      },
    }),
  ]);

  const monthlyGrowth = lastMonthQuotes === 0 
    ? 100 
    : ((currentMonthQuotes - lastMonthQuotes) / lastMonthQuotes) * 100;

  return {
    stats: {
      totalQuotes,
      acceptedQuotes,
      totalClients,
      monthlyGrowth,
    },
    recentQuotes,
    recentFiles,
  };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <PageContainer title="Dashboard">
        <ContentCard className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Unable to Load Dashboard</h3>
            <p className="text-text-muted max-w-md mx-auto">
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
      title="Dashboard"
      description="Welcome back! Here's an overview of your activity."
    >
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/quotes/new">
          <Card hover className="h-full">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <PlusIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">New Quote</h3>
                <p className="text-sm text-text-muted">Create a new quote</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import">
          <Card hover className="h-full">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <DocumentArrowUpIcon className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Import PDF</h3>
                <p className="text-sm text-text-muted">Import from PDF</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/search">
          <Card hover className="h-full">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Search Quotes</h3>
                <p className="text-sm text-text-muted">Find existing quotes</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Quotes</p>
                <p className="text-2xl font-bold text-text-primary">
                  {data.stats.totalQuotes}
                </p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-text-tertiary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Accepted</p>
                <p className="text-2xl font-bold text-success">
                  {data.stats.acceptedQuotes}
                </p>
              </div>
              <ArrowUpIcon className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Clients</p>
                <p className="text-2xl font-bold text-text-primary">
                  {data.stats.totalClients}
                </p>
              </div>
              <UsersIcon className="w-8 h-8 text-text-tertiary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Monthly Growth</p>
                <p className="text-2xl font-bold text-primary">
                  {data.stats.monthlyGrowth > 0 ? "+" : ""}{data.stats.monthlyGrowth.toFixed(0)}%
                </p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>Your latest quote activity</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentQuotes.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto w-10 h-10 bg-bg-secondary rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-text-tertiary" />
                </div>
                <p className="text-text-secondary text-sm">
                  No quotes yet. Create your first quote!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentQuotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {quote.quoteNumber}
                        </p>
                        <p className="text-sm text-text-muted">
                          {quote.client?.name || "No client"} • {quote.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary">
                          ${quote.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border">
              <Link href="/quotes">
                <Button variant="ghost" className="w-full">
                  View All Quotes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>PDF files imported for OCR</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentFiles.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto w-10 h-10 bg-bg-secondary rounded-full flex items-center justify-center">
                  <DocumentArrowUpIcon className="w-5 h-5 text-text-tertiary" />
                </div>
                <p className="text-text-secondary text-sm">
                  No files imported yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-text-primary truncate">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          file.status === "VERIFIED"
                            ? "bg-status-approved-bg text-status-approved-text"
                            : file.status === "FAILED"
                            ? "bg-status-rejected-bg text-status-rejected-text"
                            : "bg-status-draft-bg text-status-draft-text"
                        }`}
                      >
                        {file.status}
                      </span>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border">
              <Link href="/import">
                <Button variant="ghost" className="w-full">
                  Import New File
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </PageContainer>
  );
}