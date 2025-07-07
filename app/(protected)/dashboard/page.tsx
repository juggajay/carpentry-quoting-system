import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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
            <div className="mx-auto w-12 h-12 bg-critical-red/20 rounded-full flex items-center justify-center">
              <span className="text-critical-red text-2xl">⚠️</span>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-dark-elevated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Quotes</p>
                <p className="text-2xl font-bold text-white mt-1">{data.stats.totalQuotes}</p>
              </div>
              <div className="w-12 h-12 bg-electric-magenta/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="card bg-dark-elevated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Accepted Quotes</p>
                <p className="text-2xl font-bold text-white mt-1">{data.stats.acceptedQuotes}</p>
              </div>
              <div className="w-12 h-12 bg-lime-green/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="card bg-dark-elevated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Clients</p>
                <p className="text-2xl font-bold text-white mt-1">{data.stats.totalClients}</p>
              </div>
              <div className="w-12 h-12 bg-royal-blue/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="card bg-dark-elevated">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Monthly Growth</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data.stats.monthlyGrowth > 0 ? '+' : ''}{data.stats.monthlyGrowth.toFixed(0)}%
                </p>
              </div>
              <div className={`w-12 h-12 ${data.stats.monthlyGrowth >= 0 ? 'bg-lime-green/20' : 'bg-critical-red/20'} rounded-lg flex items-center justify-center`}>
                <span className="text-xl">{data.stats.monthlyGrowth >= 0 ? '📈' : '📉'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/quotes/new" className="group">
            <div className="card bg-dark-elevated hover:shadow-lg hover:shadow-electric-magenta/20 transition-all duration-300 transform hover:scale-[1.02] h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">New Quote</h3>
                  <p className="text-sm text-gray-400 mb-4">Create a professional quote</p>
                </div>
                <div className="w-12 h-12 bg-electric-magenta/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
              <button className="btn btn-primary w-full group-hover:shadow-md">Get Started</button>
            </div>
          </Link>

          <Link href="/import" className="group">
            <div className="card bg-dark-elevated hover:shadow-lg hover:shadow-royal-blue/20 transition-all duration-300 transform hover:scale-[1.02] h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Import PDF</h3>
                  <p className="text-sm text-gray-400 mb-4">Extract data from PDFs</p>
                </div>
                <div className="w-12 h-12 bg-royal-blue/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📑</span>
                </div>
              </div>
              <button className="btn btn-secondary w-full">Browse Files</button>
            </div>
          </Link>

          <Link href="/search" className="group">
            <div className="card bg-dark-elevated hover:shadow-lg hover:shadow-vibrant-cyan/20 transition-all duration-300 transform hover:scale-[1.02] h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Search Quotes</h3>
                  <p className="text-sm text-gray-400 mb-4">Find existing quotes</p>
                </div>
                <div className="w-12 h-12 bg-vibrant-cyan/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
              </div>
              <button className="btn btn-secondary w-full">Search Now</button>
            </div>
          </Link>
        </div>


        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="card bg-dark-elevated">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Quotes</h2>
          {data.recentQuotes.length === 0 ? (
            <EmptyQuotesState />
          ) : (
            <div className="space-y-3">
              {data.recentQuotes.map((quote) => (
                <Link key={quote.id} href={`/quotes/${quote.id}`} className="block group">
                  <div className="p-4 bg-dark-surface rounded-lg hover:bg-dark-navy transition-all duration-200 hover:shadow-md hover:shadow-electric-magenta/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white group-hover:text-electric-magenta transition-colors">
                          {quote.quoteNumber}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {quote.client?.name || "No client"} • {quote.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          ${quote.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <Link href="/quotes">
              <Button variant="ghost" className="w-full hover:bg-dark-surface">
                View All Quotes
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="card bg-dark-elevated">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Imports</h2>
          <p className="text-sm text-gray-400 mb-4">PDF files imported for OCR</p>
          {data.recentFiles.length === 0 ? (
            <EmptyFilesState />
          ) : (
            <div className="space-y-3">
              {data.recentFiles.map((file) => (
                <div key={file.id} className="p-4 bg-dark-surface rounded-lg hover:bg-dark-navy transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {file.fileName}
                      </p>
                      <p className="text-sm text-gray-400">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          file.status === "VERIFIED"
                            ? "bg-lime-green/20 text-lime-green"
                            : file.status === "FAILED"
                            ? "bg-critical-red/20 text-critical-red"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {file.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <Link href="/import">
              <Button variant="ghost" className="w-full hover:bg-dark-surface">
                Import New File
              </Button>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </PageContainer>
  );
}