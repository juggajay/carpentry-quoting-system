import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import UploadZone from "@/features/import/components/UploadZone";
import { getUploadedFiles } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
                <p className="text-sm font-medium text-foreground">
                  {file.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link href={`/import/${file.id}/verify`}>
                <Button size="sm" variant="secondary">
                  <span className="mr-2">👁</span>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Import Quotes
        </h1>
        <p className="text-muted-foreground">
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
                <div className="h-4 bg-background-tertiary rounded w-3/4" />
                <div className="h-4 bg-background-tertiary rounded w-1/2" />
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