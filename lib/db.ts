// Re-export the improved Prisma client to maintain backward compatibility
// All files importing from @/lib/db will now use the production-ready client
export { prisma as db } from './prisma';