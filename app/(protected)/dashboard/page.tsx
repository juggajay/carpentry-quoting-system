import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RetryButton } from "@/components/ui/RetryButton";
import PageContainer from "@/components/layout/PageContainer";
import ContentCard from "@/components/layout/ContentCard";
import { EmptyQuotesState, EmptyFilesState } from "./DashboardEmptyStates";

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
            <div className="mx-auto w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Unable to Load Dashboard</h3>
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
      title="Dashboard"
      description="Welcome back! Here's an overview of your activity."
    >
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/quotes/new">
          <Card hover className="h-full md:col-span-1">
            <CardContent className="text-center">
              <h3 className="font-semibold text-white text-lg">New Quote</h3>
              <p className="text-sm text-slate-400 mt-1">Create a new quote</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import">
          <Card hover className="h-full">
            <CardContent className="text-center">
              <h3 className="font-semibold text-white">Import PDF</h3>
              <p className="text-sm text-slate-400 mt-1">Import from PDF</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/search">
          <Card hover className="h-full">
            <CardContent className="text-center">
              <h3 className="font-semibold text-white">Search Quotes</h3>
              <p className="text-sm text-slate-400 mt-1">Find existing quotes</p>
            </CardContent>
          </Card>
        </Link>
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
              <EmptyQuotesState />
            ) : (
              <div className="space-y-2">
                {data.recentQuotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {quote.quoteNumber}
                        </p>
                        <p className="text-sm text-slate-400">
                          {quote.client?.name || "No client"} • {quote.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">
                          ${quote.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-700">
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
              <EmptyFilesState />
            ) : (
              <div className="space-y-2">
                {data.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-white truncate">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-slate-400">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          file.status === "VERIFIED"
                            ? "bg-green-600/20 text-green-600"
                            : file.status === "FAILED"
                            ? "bg-red-600/20 text-red-600"
                            : "bg-slate-600/20 text-slate-400"
                        }`}
                      >
                        {file.status}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-700">
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