import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Carpentry Quoting System
        </h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Professional quoting system designed for carpentry businesses. 
          Import quotes from PDFs, manage clients, and generate professional proposals.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="btn btn-primary transform hover:scale-105"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="btn btn-secondary transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}