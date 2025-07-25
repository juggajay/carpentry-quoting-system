'use client'

import React from 'react'
import { Building2, Calculator, RotateCcw } from 'lucide-react'

interface EstimatorHeaderProps {
  projectName: string
  onProjectNameChange: (name: string) => void
}

export function EstimatorHeader({ 
  projectName, 
  onProjectNameChange 
}: EstimatorHeaderProps) {
  return (
    <header className="bg-dark-elevated border-b border-gray-800 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Project Name */}
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-electric-magenta" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="text-lg font-semibold bg-transparent text-white border-b border-transparent hover:border-gray-600 focus:border-electric-magenta focus:outline-none transition-colors px-1"
            placeholder="Enter project name..."
          />
        </div>
        
        {/* Senior Estimator Label */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('seniorEstimatorSessionId')
                localStorage.removeItem('seniorEstimatorConfig')
                window.location.reload()
              }
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 border border-gray-700 rounded"
            title="Clear session and start fresh"
          >
            <RotateCcw className="h-3 w-3" />
            Clear Session
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <Calculator className="h-4 w-4" />
            <span className="font-medium text-sm">Senior Estimator</span>
          </div>
        </div>
      </div>
    </header>
  )
}