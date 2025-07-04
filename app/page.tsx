import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <h1 className="text-5xl font-bold text-text-primary mb-6 text-gradient">
          Carpentry Quoting System
        </h1>
        <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
          Professional quoting system designed for carpentry businesses. 
          Import quotes from PDFs, manage clients, and generate professional proposals.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-primary-light hover:bg-primary-DEFAULT text-white rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-background-card hover:bg-background-hover text-text-primary border border-border-default rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}