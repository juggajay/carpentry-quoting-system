"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  DocumentTextIcon, 
  UsersIcon, 
  ArrowUpIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  DocumentArrowUpIcon
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-secondary">
          Welcome back! Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/quotes/new">
          <Card hover className="h-full">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary-light/10 rounded-lg">
                <PlusIcon className="w-6 h-6 text-primary-light" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">New Quote</h3>
                <p className="text-sm text-text-secondary">Create a new quote</p>
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
                <p className="text-sm text-text-secondary">Import from PDF</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/search">
          <Card hover className="h-full">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Search Quotes</h3>
                <p className="text-sm text-text-secondary">Find existing quotes</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Database Setup Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Required</CardTitle>
          <CardDescription>Database connection needs to be configured</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-4">
            To use all features, please configure your database connection in Vercel:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
            <li>Set up a PostgreSQL database (Supabase, Neon, or Vercel Postgres)</li>
            <li>Add the DATABASE_URL environment variable in Vercel settings</li>
            <li>Redeploy your application</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}