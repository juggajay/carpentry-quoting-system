'use client'

import React, { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useEstimator } from '../context/EstimatorContext'

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
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { addActivity, addEstimateItem, updateJobDetails, updateScopeSummary, addTodoItem, projectConfig } = useEstimator()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxSize = 50 * 1024 * 1024; // 50MB limit for Vercel Pro
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
        message: `Files too large (max 50MB): ${oversizedFiles.join(', ')}`
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
      // Create FormData with all files
      const formData = new FormData()
      files.forEach(file => {
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
      
      // Update session ID
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId)
      }
      
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
      
    } catch (error) {
      console.error('Error analyzing files:', error)
      
      let errorMessage = 'Analysis failed'
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          errorMessage = 'File too large. Maximum size is 50MB per file.'
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
            Supports PDF, Images, Excel, CSV • Max 50MB per file
          </p>
        </div>

        {/* Analyze Button */}
        {files.length > 0 && (
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
    </div>
  )
}