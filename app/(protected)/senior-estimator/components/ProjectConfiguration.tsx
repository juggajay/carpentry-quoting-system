'use client'

import React, { useState } from 'react'
import { Settings, MapPin, Building2 } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'

const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' }
] as const

const LOCATIONS = [
  { value: 'NSW, Australia', label: 'New South Wales' },
  { value: 'VIC, Australia', label: 'Victoria' },
  { value: 'QLD, Australia', label: 'Queensland' },
  { value: 'WA, Australia', label: 'Western Australia' },
  { value: 'SA, Australia', label: 'South Australia' },
  { value: 'TAS, Australia', label: 'Tasmania' },
  { value: 'NT, Australia', label: 'Northern Territory' },
  { value: 'ACT, Australia', label: 'Australian Capital Territory' }
] as const

export function ProjectConfiguration() {
  const { projectConfig, updateProjectConfig } = useEstimator()
  const [isEditing, setIsEditing] = useState(false)
  const [tempConfig, setTempConfig] = useState(projectConfig)

  const handleSave = () => {
    updateProjectConfig(tempConfig)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempConfig(projectConfig)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="p-4 bg-dark-surface border border-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Project Configuration
          </h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-electric-magenta hover:text-electric-magenta/80 transition-colors"
          >
            Edit
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-400">Type:</span>
            <span className="text-gray-200">
              {PROJECT_TYPES.find(t => t.value === projectConfig.projectType)?.label || 'Not set'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-400">Location:</span>
            <span className="text-gray-200">
              {LOCATIONS.find(l => l.value === projectConfig.location)?.label || 'Not set'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-dark-surface border border-gray-800 rounded-lg">
      <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
        <Settings className="h-4 w-4" />
        Project Configuration
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Project Type</label>
          <select
            value={tempConfig.projectType || ''}
            onChange={(e) => setTempConfig({ ...tempConfig, projectType: e.target.value as any })}
            className="w-full bg-dark-elevated border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric-magenta"
          >
            <option value="">Select type...</option>
            {PROJECT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Location</label>
          <select
            value={tempConfig.location || ''}
            onChange={(e) => setTempConfig({ ...tempConfig, location: e.target.value })}
            className="w-full bg-dark-elevated border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-electric-magenta"
          >
            <option value="">Select location...</option>
            {LOCATIONS.map(loc => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={!tempConfig.projectType || !tempConfig.location}
          className="flex-1 bg-electric-magenta text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-electric-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 bg-gray-700 text-gray-200 rounded px-3 py-1.5 text-sm font-medium hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}