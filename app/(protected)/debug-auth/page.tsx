import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function DebugAuth() {
  // Get Clerk user
  const clerkUser = await currentUser();
  
  // Try to find user in database
  let dbUser = null;
  let error = null;
  
  if (clerkUser) {
    try {
      dbUser = await db.user.findUnique({
        where: {
          clerkId: clerkUser.id
        }
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Database error";
    }
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Authentication Debug Info</h1>
      
      <div className="space-y-6">
        <div className="bg-dark-elevated p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-electric-magenta">Clerk User Info:</h2>
          {clerkUser ? (
            <pre className="text-sm overflow-auto text-gray-300">
              {JSON.stringify({
                id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
              }, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">No Clerk user found - not logged in</p>
          )}
        </div>
        
        <div className="bg-dark-elevated p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-electric-magenta">Database User Info:</h2>
          {dbUser ? (
            <pre className="text-sm overflow-auto text-gray-300">
              {JSON.stringify(dbUser, null, 2)}
            </pre>
          ) : (
            <p className="text-critical-red">
              No database user found with Clerk ID: {clerkUser?.id}
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-critical-red/20 p-4 rounded-lg">
            <h2 className="font-semibold mb-2 text-critical-red">Error:</h2>
            <p className="text-critical-red">{error}</p>
          </div>
        )}
        
        <div className="bg-dark-elevated p-4 rounded-lg">
          <h2 className="font-semibold mb-2 text-electric-magenta">Environment Info:</h2>
          <pre className="text-sm overflow-auto text-gray-300">
            {JSON.stringify({
              nodeEnv: process.env.NODE_ENV,
              clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set (hidden)' : 'Not set',
              afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
              afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}