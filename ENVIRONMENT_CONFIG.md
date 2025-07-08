# Environment Configuration Guide

## Overview

This project uses a simplified environment configuration approach with Supabase PostgreSQL as the database for both development and production environments.

## File Structure

### `.env.local` (Main Configuration)
- **Purpose**: Contains all environment variables for local development
- **Location**: Project root
- **Git Status**: Ignored (never commit this file)
- **Database**: Supabase PostgreSQL

### `.env.production.local` (Production Overrides)
- **Purpose**: Contains production-specific overrides (mainly for Clerk production keys)
- **Location**: Project root
- **Git Status**: Ignored (never commit this file)
- **Usage**: Only needed when deploying to production with different Clerk keys

### `.env.example` (Template)
- **Purpose**: Template file showing required environment variables
- **Location**: Project root
- **Git Status**: Committed (safe to share)
- **Usage**: Copy to `.env.local` and fill in actual values

## Configuration Values

### Database Configuration
```
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DATABASE_URL_POOLED="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```
- **DATABASE_URL**: Direct connection for migrations and development
- **DATABASE_URL_POOLED**: Pooled connection for production deployments

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."  # Development
CLERK_SECRET_KEY="sk_test_..."                   # Development

# For production (in .env.production.local):
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."  # Production
CLERK_SECRET_KEY="sk_live_..."                   # Production
```

## Setup Instructions

1. **Initial Setup**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local`

3. **For production deployment**:
   - Create `.env.production.local` if you need different Clerk keys
   - Most hosting platforms (Vercel, etc.) will use `.env.local` values by default

## Important Notes

- **No SQLite**: This project uses Supabase PostgreSQL exclusively
- **Single Database**: Same database instance for development and production
- **Security**: Never commit `.env.local` or `.env.production.local`
- **Simplicity**: Most developers only need `.env.local`

## Environment Variable Loading Order (Next.js)

1. `.env.production.local` (production only)
2. `.env.local` (all environments except test)
3. `.env.production` or `.env.development` (based on NODE_ENV)
4. `.env`

Since we're using `.env.local` for all configurations and `.env.production.local` for production overrides, this gives us the cleanest setup.