'use client'

import React from 'react'
import { Activity, FileText, MessageSquare, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'

export function ActivityMonitor() {
  const { activities } = useEstimator()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-4 w-4" />
      case 'chat':
        return <MessageSquare className="h-4 w-4" />
      case 'analysis':
        return <Activity className="h-4 w-4" />
      case 'complete':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'text-info-blue bg-info-blue/10'
      case 'chat':
        return 'text-electric-magenta bg-electric-magenta/10'
      case 'analysis':
        return 'text-vibrant-cyan bg-vibrant-cyan/10'
      case 'complete':
        return 'text-success-green bg-success-green/10'
      case 'error':
        return 'text-critical-red bg-critical-red/10'
      default:
        return 'text-gray-400 bg-gray-800'
    }
  }

  return (
    <div className="h-full flex flex-col bg-dark-elevated">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Activity Monitor</h2>
        <p className="text-sm text-gray-400 mt-1">Real-time processing updates</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Activity className="h-8 w-8 mx-auto text-gray-600 mb-2" />
            <p className="text-sm">No activities yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 animate-fadeIn"
              >
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="p-4 border-t border-gray-800 bg-dark-surface">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-white">
              {activities.filter(a => a.type === 'file').length}
            </p>
            <p className="text-xs text-gray-400">Files</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {activities.filter(a => a.type === 'analysis').length}
            </p>
            <p className="text-xs text-gray-400">Analyses</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {activities.filter(a => a.type === 'complete').length}
            </p>
            <p className="text-xs text-gray-400">Complete</p>
          </div>
        </div>
      </div>
    </div>
  )
}