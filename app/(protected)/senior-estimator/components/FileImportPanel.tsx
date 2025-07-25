'use client'

import React, { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Link } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useEstimator } from '../context/EstimatorContext'
import { LinkImportDialog } from './LinkImportDialog'
import { BlobFileUpload } from './BlobFileUpload'

interface ImportedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'uploaded' | 'processing' | 'ready' | 'error'
  uploadProgress?: number
  file: File
  error?: string
}

export function FileImportPanel() {
  const [files, setFiles] = useState<ImportedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const { addActivity, addEstimateItem, updateJobDetails, updateScopeSummary, addTodoItem, projectConfig, sessionId, setSessionId, setHasAnalyzedFiles } = useEstimator()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxSize = 4.5 * 1024 * 1024; // 4.5MB hard limit by Vercel
    const validFiles: typeof acceptedFiles = [];
    const oversizedFiles: string[] = [];
    
    acceptedFiles.forEach(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (oversizedFiles.length > 0) {
      addActivity({
        type: 'error',
        message: `Files too large: ${oversizedFiles.join(', ')}\n\nVercel has a 4.5MB limit. Please:\n• Compress PDFs at smallpdf.com\n• Split large files\n• Use Google Drive links instead`
      });
    }
    
    const newFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploaded' as const,
      uploadProgress: 100,
      file: file
    }))

    setFiles(prev => [...prev, ...newFiles])
    
    // Add activity for each valid file
    newFiles.forEach(file => {
      addActivity({
        type: 'file',
        message: `Added file: ${file.name}`
      })
    })
  }, [addActivity])

  const analyzeFiles = async () => {
    if (files.length === 0 || isAnalyzing) return

    // Check if project is configured
    if (!projectConfig.projectType || !projectConfig.location) {
      addActivity({
        type: 'error',
        message: 'Please configure your project type and location first'
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Separate regular files from cloud/URL files
      const regularFiles = files.filter(f => f.type !== 'cloud' && f.type !== 'url')
      const cloudFiles = files.filter(f => f.type === 'cloud' || f.type === 'url')
      
      // If we have cloud files, use JSON format instead
      if (cloudFiles.length > 0) {
        // Use JSON format for cloud URLs
        const fileUrls = cloudFiles.map(f => ({
          url: (f.file as any).url,
          name: f.name,
          type: f.type,
          size: f.size
        }))
        
        const response = await fetch('/api/senior-estimator/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrls,
            sessionId,
            projectType: projectConfig.projectType,
            location: projectConfig.location
          })
        })
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`)
        }
        
        const data = await response.json()
        processAnalysisResult(data)
        return
      }
      
      // Otherwise use FormData for regular files
      const formData = new FormData()
      regularFiles.forEach(file => {
        formData.append('files', file.file)
      })
      
      if (sessionId) {
        formData.append('sessionId', sessionId)
      }
      
      formData.append('projectType', projectConfig.projectType)
      formData.append('location', projectConfig.location)
      
      // Mark all files as processing
      setFiles(prev => prev.map(f => ({ ...f, status: 'processing' })))
      
      addActivity({
        type: 'analysis',
        message: `Analyzing ${files.length} files...`
      })
      
      const response = await fetch('/api/senior-estimator/analyze', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }
      
      const data = await response.json()
      processAnalysisResult(data)
      
    } catch (error) {
      console.error('Error analyzing files:', error)
      
      let errorMessage = 'Analysis failed'
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          errorMessage = 'File too large. Vercel has a 4.5MB limit. Try compressing at smallpdf.com or use Google Drive links.'
        } else {
          errorMessage = error.message
        }
      }
      
      // Mark files as error
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error',
        error: errorMessage
      })))
      
      addActivity({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }
  
  const processAnalysisResult = (data: any) => {
    console.log('Processing analysis result, sessionId:', data.sessionId)
    
    // Update session ID
    if (!sessionId && data.sessionId) {
      console.log('Setting sessionId:', data.sessionId)
      setSessionId(data.sessionId)
    }
    
    // Mark that we have analyzed files
    console.log('Setting hasAnalyzedFiles to true')
    setHasAnalyzedFiles(true)
    
    // Process the estimation result
    const result = data.result
    
    // Update job details
    if (result.scope_analysis.extractedItems.length > 0) {
      updateJobDetails({
        projectType: projectConfig.projectType,
        location: projectConfig.location,
        estimatedCost: 0,
        estimatedDays: parseInt(result.estimated_duration)
      })
    }
    
    // Add extracted items to estimates
    result.quote_items.forEach((item: any) => {
      addEstimateItem({
        id: item.id,
        category: item.category || 'General',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.unitPrice || 0,
        total: item.totalPrice || 0,
        confidence: item.confidence.score >= 85 ? 'high' : 
                    item.confidence.score >= 70 ? 'medium' : 'low'
      })
    })
    
    // Update scope summary
    const scopeItems = result.scope_analysis.extractedItems.map((item: any) => 
      `${item.description} (${item.confidence.score}% confidence)`
    )
    updateScopeSummary(scopeItems)
    
    // Add next steps as todos
    result.next_steps.forEach((step: string) => {
      addTodoItem(step, 'medium')
    })
    
    // Mark files as ready
    setFiles(prev => prev.map(f => ({ ...f, status: 'ready' })))
    
    addActivity({
      type: 'complete',
      message: `Analysis complete: ${result.scope_analysis.extractedItems.length} items found`
    })
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
            Supports PDF, Images, Excel, CSV • Max 4.5MB (Vercel limit)
          </p>
        </div>

        {/* Blob Upload for large files */}
        <BlobFileUpload 
          onFileUploaded={(url, fileName, fileSize) => {
            // Add as a cloud file
            const cloudFileObj: ImportedFile = {
              id: Math.random().toString(36).substr(2, 9),
              name: fileName,
              size: fileSize,
              type: 'cloud',
              status: 'uploaded',
              uploadProgress: 100,
              file: new File([], fileName) // Placeholder
            };
            
            // Store the URL
            (cloudFileObj.file as any).url = url;
            
            setFiles(prev => [...prev, cloudFileObj]);
          }}
        />

        {/* Import from URL button */}
        <button
          onClick={() => setShowLinkDialog(true)}
          className="mt-2 w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <Link className="h-4 w-4" />
          Import from External URL
        </button>

        {/* Analyze Button */}
        {files.length > 0 && (
          <>
            <button
              onClick={analyzeFiles}
              disabled={isAnalyzing || files.length === 0}
              className="mt-4 w-full bg-electric-magenta text-white rounded-lg px-4 py-2 font-medium hover:bg-electric-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Files...
                </>
              ) : (
                'Analyze Files'
              )}
            </button>
            
            <p className="text-xs text-gray-400 mt-2 text-center">
              Tip: After uploading drawings, describe the scope in the chat
            </p>
          </>
        )}

        {/* File List */}
        <div className={files.length > 0 ? "mt-4 space-y-2" : "mt-4 space-y-2"}>
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
                
                {/* Error message */}
                {file.error && (
                  <p className="text-xs text-critical-red mt-1">{file.error}</p>
                )}
                
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
                {file.status === 'uploaded' && (
                  <div className="text-xs text-gray-400">Ready to analyze</div>
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
      
      {/* Link Import Dialog */}
      <LinkImportDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onImport={(url, fileName) => {
          // Add the URL as a "file" to be analyzed
          const linkFile: ImportedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: fileName,
            size: 0, // Unknown size for URLs
            type: 'url',
            status: 'uploaded',
            uploadProgress: 100,
            file: new File([], fileName) // Placeholder file
          }
          
          setFiles(prev => [...prev, linkFile]);
          addActivity({
            type: 'file',
            message: `Added link: ${fileName}`
          });
          
          // Store the URL in a way we can access it later
          (linkFile.file as any).url = url
        }}
      />
    </div>
  )
}