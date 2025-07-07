"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { prepareUpload, updateFileAfterUpload, processUploadedPdf } from "@/app/(protected)/import/actions";
import FileStatusCard from "./FileStatusCard";

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "preparing" | "uploading" | "processing" | "completed" | "failed";
  error?: string;
}

export default function UploadZone() {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadFile = async (file: File) => {
    const tempId = Math.random().toString(36).substring(7);
    
    // Add file to UI immediately
    setUploadingFiles((prev) => [
      ...prev,
      {
        id: tempId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "preparing",
      },
    ]);

    try {
      // Step 1: Prepare upload
      const prepareResult = await prepareUpload(file.name);
      
      if (!prepareResult.success || !prepareResult.uploadUrl) {
        throw new Error(prepareResult.error || "Failed to prepare upload");
      }

      const { fileId, uploadUrl, filePath } = prepareResult;

      // Update file ID and status
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? { ...f, id: fileId, status: "uploading" as const }
            : f
        )
      );

      // Step 2: Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, progress } : f
            )
          );
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Update file record
      await updateFileAfterUpload(fileId, file.size, filePath!);

      // Update status to processing
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "processing" as const, progress: 100 }
            : f
        )
      );

      // Step 4: Process PDF with OCR
      const processResult = await processUploadedPdf(fileId);

      if (!processResult.success) {
        throw new Error(processResult.error || "Processing failed");
      }

      // Update status to completed
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "completed" as const } : f
        )
      );

      toast.success(`${file.name} uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === tempId || f.name === file.name
            ? {
                ...f,
                status: "failed" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );

      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF file`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return;
      }

      uploadFile(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? "border-electric-magenta bg-electric-magenta/5"
              : "border-gray-700 hover:border-gray-600 bg-dark-elevated/50 hover:bg-dark-elevated"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          {isDragActive ? (
            <>
              <span className="text-4xl animate-bounce">↑</span>
              <p className="text-lg font-medium text-white">Drop your PDF here</p>
            </>
          ) : (
            <>
              <span className="text-4xl">📄</span>
              <div>
                <p className="text-lg font-medium text-white">
                  Drag and drop PDF quotes here
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  or click to browse (max 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((file) => (
            <FileStatusCard
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}