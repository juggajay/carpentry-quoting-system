-- CreateTable
CREATE TABLE "AISession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "files" JSONB,
    "generatedQuote" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceUpdate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "scrapedPrice" DOUBLE PRECISION NOT NULL,
    "percentChange" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvalNotes" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCPConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MCPConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AISession_userId_idx" ON "AISession"("userId");

-- CreateIndex
CREATE INDEX "AISession_status_idx" ON "AISession"("status");

-- CreateIndex
CREATE INDEX "PriceUpdate_productId_idx" ON "PriceUpdate"("productId");

-- CreateIndex
CREATE INDEX "PriceUpdate_status_idx" ON "PriceUpdate"("status");

-- CreateIndex
CREATE INDEX "MCPConnection_type_idx" ON "MCPConnection"("type");

-- CreateIndex
CREATE INDEX "MCPConnection_status_idx" ON "MCPConnection"("status");

-- AddForeignKey
ALTER TABLE "AISession" ADD CONSTRAINT "AISession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceUpdate" ADD CONSTRAINT "PriceUpdate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;