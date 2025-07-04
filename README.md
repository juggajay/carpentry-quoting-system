# Carpentry Quoting System

A professional quoting system designed for carpentry businesses. Import quotes from PDFs, manage clients, and generate professional proposals.

## Features

- 🔐 **Secure Authentication** - Powered by Clerk
- 📄 **PDF Import & OCR** - Extract quote data from PDF files automatically
- 🎨 **Modern UI** - Dark theme with smooth animations and micro-interactions
- 💾 **Database** - SQLite for development, PostgreSQL for production
- 🔍 **Search & Filter** - Find quotes quickly with advanced search
- 📊 **Quote Builder** - Create and edit quotes with drag-and-drop line items
- 📤 **Export** - Generate PDF quotes and CSV exports

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: Clerk
- **File Storage**: Supabase Storage
- **UI Components**: Radix UI, Framer Motion
- **Forms**: React Hook Form
- **OCR**: Tesseract.js

## Getting Started

### Prerequisites

- Node.js 18+ 
- Clerk account for authentication
- Supabase account for storage

### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd carpentry-quoting-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Copy `.env.example` to `.env.local` and update with your actual keys from:
- [Supabase Dashboard](https://supabase.com)
- [Clerk Dashboard](https://clerk.com)

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── (protected)/     # Protected routes
│   ├── sign-in/         # Authentication pages
│   └── layout.tsx       # Root layout
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   └── layout/         # Layout components
├── features/            # Feature-specific components
├── lib/                 # Utilities and helpers
├── prisma/              # Database schema
└── public/              # Static assets
```

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Add these in Vercel dashboard:
- All variables from `.env.local`
- Update DATABASE_URL to PostgreSQL

## Features Implemented

- ✅ Authentication with Clerk
- ✅ File upload with progress tracking
- ✅ OCR processing for PDFs
- ✅ Verification UI with PDF preview
- ✅ Quote management
- ✅ Responsive animated UI
- 🚧 Search functionality (in progress)
- 🚧 Quote builder (in progress)
- 🚧 PDF generation (planned)

## License

MIT
