# Database Migration Instructions for Senior Estimator

## Issue
The Senior Estimator feature requires new database tables that haven't been created yet. The application includes a demo mode that works without database persistence.

## Required Tables
- `EstimatorSession` - Stores user sessions
- `EstimatorAnalysis` - Stores analysis results
- `EstimatorQuestion` - Stores generated questions

## Migration Steps

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to create the tables:

```sql
-- Create enum types
CREATE TYPE "EstimatorSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "EstimatorAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY_FOR_PRICING', 'NEEDS_CLARIFICATION', 'COMPLETED', 'FAILED');
CREATE TYPE "EstimatorQuestionPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "EstimatorQuestionStatus" AS ENUM ('PENDING', 'ANSWERED', 'SKIPPED');

-- Create EstimatorSession table
CREATE TABLE "EstimatorSession" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "status" "EstimatorSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" JSONB,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimatorSession_pkey" PRIMARY KEY ("id")
);

-- Create EstimatorAnalysis table
CREATE TABLE "EstimatorAnalysis" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" TEXT NOT NULL,
    "scopeAnalysis" JSONB NOT NULL,
    "drawingAnalyses" JSONB NOT NULL,
    "quoteItems" JSONB NOT NULL,
    "confidenceSummary" JSONB NOT NULL,
    "auditTrail" JSONB NOT NULL,
    "status" "EstimatorAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimatorAnalysis_pkey" PRIMARY KEY ("id")
);

-- Create EstimatorQuestion table
CREATE TABLE "EstimatorQuestion" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "priority" "EstimatorQuestionPriority" NOT NULL DEFAULT 'MEDIUM',
    "context" JSONB,
    "defaultAnswer" TEXT,
    "userAnswer" TEXT,
    "status" "EstimatorQuestionStatus" NOT NULL DEFAULT 'PENDING',
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimatorQuestion_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "EstimatorSession_userId_idx" ON "EstimatorSession"("userId");
CREATE INDEX "EstimatorSession_status_idx" ON "EstimatorSession"("status");
CREATE INDEX "EstimatorAnalysis_sessionId_idx" ON "EstimatorAnalysis"("sessionId");
CREATE INDEX "EstimatorAnalysis_status_idx" ON "EstimatorAnalysis"("status");
CREATE INDEX "EstimatorQuestion_sessionId_idx" ON "EstimatorQuestion"("sessionId");
CREATE INDEX "EstimatorQuestion_analysisId_idx" ON "EstimatorQuestion"("analysisId");
CREATE INDEX "EstimatorQuestion_status_idx" ON "EstimatorQuestion"("status");
CREATE INDEX "EstimatorQuestion_priority_idx" ON "EstimatorQuestion"("priority");

-- Add foreign keys
ALTER TABLE "EstimatorSession" ADD CONSTRAINT "EstimatorSession_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EstimatorAnalysis" ADD CONSTRAINT "EstimatorAnalysis_sessionId_fkey" 
    FOREIGN KEY ("sessionId") REFERENCES "EstimatorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EstimatorQuestion" ADD CONSTRAINT "EstimatorQuestion_sessionId_fkey" 
    FOREIGN KEY ("sessionId") REFERENCES "EstimatorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EstimatorQuestion" ADD CONSTRAINT "EstimatorQuestion_analysisId_fkey" 
    FOREIGN KEY ("analysisId") REFERENCES "EstimatorAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Option 2: Using Prisma CLI (Recommended)
If you have database access from your local environment:

```bash
# Set up environment
export DATABASE_URL="your-direct-database-url"

# Generate migration
npx prisma migrate dev --name add-senior-estimator-models

# Or deploy existing migrations
npx prisma migrate deploy
```

### Option 3: Using Demo Mode
The application includes a demo mode that works without database persistence:
- The chat interface will automatically fallback to `/api/senior-estimator/chat-demo`
- Results are processed but not saved
- Perfect for testing the functionality

## Verifying Migration
Run the check script:
```bash
node scripts/check-db-schema.js
```

## Demo Mode Features
While in demo mode:
- All Senior Estimator AI features work normally
- Scope analysis and quantity extraction function
- Questions are generated
- Results are displayed in the UI
- ⚠️ Results are NOT saved to database
- ⚠️ Session history is NOT available

## Production Requirements
For production use:
1. Run the database migration
2. Ensure DATABASE_URL points to a reachable PostgreSQL instance
3. Test with the check script
4. Remove or disable demo endpoints for security