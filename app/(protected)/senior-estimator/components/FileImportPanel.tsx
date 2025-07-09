'use client'

import React, { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

interface ImportedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  uploadProgress?: number
}

export function FileImportPanel() {
  const [files, setFiles] = useState<ImportedFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      uploadProgress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Simulate file upload
    newFiles.forEach(file => {
      simulateFileUpload(file.id)
    })
  }, [])

  const simulateFileUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadProgress: progress }
          : f
      ))

      if (progress >= 100) {
        clearInterval(interval)
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'processing' }
            : f
        ))

        // Simulate processing
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'ready' }
              : f
          ))
        }, 2000)
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    }
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    return Math.round(bytes / 1048576) + ' MB'
  }

  return (
    <div className="h-full flex flex-col bg-dark-elevated">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">File Import</h2>
        <p className="text-sm text-gray-400 mt-1">Upload drawings, BOQs, and specifications</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-electric-magenta bg-electric-magenta/10' 
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-300">
            {isDragActive 
              ? 'Drop files here...' 
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supports PDF, Images, Excel, CSV
          </p>
        </div>

        {/* File List */}
        <div className="mt-4 space-y-2">
          {files.map(file => (
            <div 
              key={file.id} 
              className="bg-dark-surface border border-gray-800 rounded-lg p-3 flex items-center gap-3"
            >
              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </p>
                
                {/* Progress bar */}
                {file.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-electric-magenta h-1 rounded-full transition-all"
                      style={{ width: `${file.uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                {file.status === 'uploading' && (
                  <div className="text-xs text-gray-400">Uploading...</div>
                )}
                {file.status === 'processing' && (
                  <div className="text-xs text-vibrant-cyan">Processing...</div>
                )}
                {file.status === 'ready' && (
                  <CheckCircle className="h-5 w-5 text-success-green" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-critical-red" />
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFile(file.id)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}