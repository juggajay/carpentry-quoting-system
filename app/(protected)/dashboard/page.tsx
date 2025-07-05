import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
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
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100">Unable to Load Dashboard</h3>
            <p className="text-gray-400 max-w-md mx-auto">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/quotes/new">
          <Card hover className="h-full">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <PlusIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-100">New Quote</h3>
                <p className="text-sm text-gray-400">Create a new quote</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import">
          <Card hover className="h-full">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DocumentArrowUpIcon className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-100">Import PDF</h3>
                <p className="text-sm text-gray-400">Import from PDF</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/search">
          <Card hover className="h-full">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-100">Search Quotes</h3>
                <p className="text-sm text-gray-400">Find existing quotes</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <ContentCard
        title="Overview"
        description="Key metrics and performance"
        variant="ghost"
        noPadding
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-100">
                  {data.stats.totalQuotes}
                </p>
              </div>
              <DocumentTextIcon className="w-6 h-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-green-500">
                  {data.stats.acceptedQuotes}
                </p>
              </div>
              <ArrowUpIcon className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Clients</p>
                <p className="text-2xl font-bold text-gray-100">
                  {data.stats.totalClients}
                </p>
              </div>
              <UsersIcon className="w-6 h-6 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Monthly Growth</p>
                <p className="text-2xl font-bold text-purple-500">
                  {data.stats.monthlyGrowth > 0 ? "+" : ""}{data.stats.monthlyGrowth.toFixed(0)}%
                </p>
              </div>
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        </div>
      </ContentCard>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>Your latest quote activity</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentQuotes.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No quotes yet. Create your first quote!
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentQuotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-100">
                          {quote.quoteNumber}
                        </p>
                        <p className="text-sm text-gray-400">
                          {quote.client?.name || "No client"} • {quote.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-100">
                          ${quote.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-700">
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
              <p className="text-gray-400 text-center py-4">
                No files imported yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-100 truncate">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-gray-400">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          file.status === "VERIFIED"
                            ? "bg-green-500/10 text-green-500"
                            : file.status === "FAILED"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {file.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <Link href="/import">
                <Button variant="ghost" className="w-full">
                  Import New File
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}