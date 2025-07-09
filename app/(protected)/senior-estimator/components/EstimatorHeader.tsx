'use client'

import React from 'react'
import { Building2, Users } from 'lucide-react'

interface EstimatorHeaderProps {
  projectName: string
  estimatorMode: 'senior' | 'junior'
  onModeToggle: (mode: 'senior' | 'junior') => void
  onProjectNameChange: (name: string) => void
}

export function EstimatorHeader({ 
  projectName, 
  estimatorMode, 
  onModeToggle,
  onProjectNameChange 
}: EstimatorHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Project Name */}
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-royal-blue" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-royal-blue focus:outline-none transition-colors px-1"
            placeholder="Enter project name..."
          />
        </div>
        
        {/* Estimator Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onModeToggle('senior')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              estimatorMode === 'senior'
                ? 'bg-royal-blue text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Senior Estimator</span>
          </button>
          <button
            onClick={() => onModeToggle('junior')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              estimatorMode === 'junior'
                ? 'bg-royal-blue text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Junior Estimator</span>
          </button>
        </div>
      </div>
    </header>
  )
}