'use client'

import React, { useState } from 'react'
import { Link, X } from 'lucide-react'

interface LinkImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (url: string, fileName: string) => void
}

export function LinkImportDialog({ isOpen, onClose, onImport }: LinkImportDialogProps) {
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url && fileName) {
      onImport(url, fileName)
      setUrl('')
      setFileName('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-elevated rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link className="h-5 w-5" />
            Import from URL
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          For files larger than 4.5MB, upload to Google Drive, Dropbox, or similar and paste the sharing link here.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">File URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full bg-dark-surface border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric-magenta"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Project drawings.pdf"
              className="w-full bg-dark-surface border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric-magenta"
              required
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-electric-magenta text-white rounded px-4 py-2 text-sm font-medium hover:bg-electric-magenta/90 transition-colors"
            >
              Import
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-200 rounded px-4 py-2 text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}