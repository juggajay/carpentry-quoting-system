# Vercel Blob Storage Setup

To enable large file uploads (up to 500MB), you need to set up Vercel Blob Storage:

## 1. Enable Blob Storage in Vercel

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Select "Blob"
5. Choose a name for your blob store
6. Select your region

## 2. Add Environment Variable

After creating the blob store, Vercel will provide you with a `BLOB_READ_WRITE_TOKEN`.

Add this to your Vercel environment variables:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxx
```

## 3. How It Works

- Files up to 4.5MB: Upload directly through the regular upload
- Files larger than 4.5MB: Use the "Upload Large File" button
  - Files upload directly from your browser to Vercel Blob Storage
  - Bypasses the 4.5MB API limit
  - Supports files up to 500MB
  - The file URL is then sent to the API for processing

## 4. Pricing

- Vercel Blob Storage pricing:
  - Free tier: 1GB storage, 1GB bandwidth per month
  - Pro: $0.25/GB storage, $0.36/GB bandwidth

## 5. Alternative: External Storage

If you prefer not to use Vercel Blob, users can:
- Upload files to Google Drive, Dropbox, etc.
- Use the "Import from External URL" button
- Paste the sharing link

The system will fetch and process files from external URLs.