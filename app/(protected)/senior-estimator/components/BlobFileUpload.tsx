'use client'

import React, { useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Upload, Loader2 } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'

interface BlobFileUploadProps {
  onFileUploaded: (url: string, fileName: string, fileSize: number) => void
}

export function BlobFileUpload({ onFileUploaded }: BlobFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { addActivity } = useEstimator()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload directly to Vercel Blob
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/senior-estimator/upload-token',
        onUploadProgress: (event) => {
          if (event.total) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        },
      })

      // Notify parent component
      onFileUploaded(blob.url, file.name, file.size)
      
      addActivity({
        type: 'file',
        message: `Uploaded to cloud: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`
      })

      // Reset input
      e.target.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      addActivity({
        type: 'error',
        message: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="mt-4">
      <label className="relative">
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={isUploading}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />
        
        <div className="w-full bg-vibrant-cyan text-white rounded-lg px-4 py-2 font-medium hover:bg-vibrant-cyan/90 transition-colors cursor-pointer flex items-center justify-center gap-2">
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Large File (up to 500MB)
            </>
          )}
        </div>
      </label>
      
      {isUploading && (
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-vibrant-cyan h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      
      <p className="text-xs text-gray-400 mt-2 text-center">
        Files upload directly to cloud storage, bypassing size limits
      </p>
    </div>
  )
}