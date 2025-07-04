import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Welcome to Carpentry Quoting System
        </h1>
        <p className="text-text-secondary">
          Hello, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </p>
      </div>
    </div>
  );
}