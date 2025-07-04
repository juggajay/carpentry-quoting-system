import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import UploadZone from "@/features/import/components/UploadZone";
import { getUploadedFiles } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EyeIcon } from "@heroicons/react/24/outline";

export const dynamic = 'force-dynamic';

async function RecentUploads() {
  const files = await getUploadedFiles();
  
  const pendingFiles = files.filter(
    (file) => file.status === "PENDING_VERIFICATION"
  );

  if (pendingFiles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Verification</CardTitle>
        <CardDescription>
          These files are ready to be verified and imported
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {file.fileName}
                </p>
                <p className="text-xs text-text-secondary">
                  Uploaded {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link href={`/import/${file.id}/verify`}>
                <Button size="sm" variant="secondary">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Import Quotes
        </h1>
        <p className="text-text-secondary">
          Upload PDF quotes to extract and import data automatically
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
          <CardDescription>
            Drag and drop your PDF quotes or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadZone />
        </CardContent>
      </Card>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-background-hover rounded w-3/4" />
                <div className="h-4 bg-background-hover rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        }
      >
        <RecentUploads />
      </Suspense>
    </div>
  );
}