// Mock Prisma client for when database is unreachable
// This allows the app to function with limited features

export const createMockPrismaClient = () => {
  const mockUser = {
    id: 'mock-user-id',
    clerkId: 'mock-clerk-id',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'VIEWER',
    isActive: true,
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: false,
    canViewAllQuotes: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    user: {
      findUnique: async () => mockUser,
      findFirst: async () => mockUser,
      findMany: async () => [mockUser],
      create: async (data: { data: Record<string, unknown> }) => ({ ...mockUser, ...data.data }),
      update: async (data: { data: Record<string, unknown> }) => ({ ...mockUser, ...data.data }),
      upsert: async (data: { create: Record<string, unknown> }) => ({ ...mockUser, ...data.create }),
      count: async () => 1,
    },
    quote: {
      count: async () => 0,
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
    },
    client: {
      count: async () => 0,
      findMany: async () => [],
    },
    uploadedFile: {
      findMany: async () => [],
    },
    material: {
      findMany: async () => [],
      count: async () => 0,
    },
    laborRate: {
      findMany: async () => [],
    },
    mCPConnection: {
      findMany: async () => [],
      create: async (data: { data: Record<string, unknown> }) => ({ id: 'mock-id', ...data.data }),
      update: async (data: { data: Record<string, unknown> }) => ({ id: 'mock-id', ...data.data }),
    },
    $connect: async () => {},
    $disconnect: async () => {},
    $transaction: async (fn: (client: unknown) => Promise<unknown>) => fn(this),
  };
};