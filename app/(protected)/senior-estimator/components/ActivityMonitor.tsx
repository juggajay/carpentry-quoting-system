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
        return 'text-blue-600 bg-blue-50'
      case 'chat':
        return 'text-purple-600 bg-purple-50'
      case 'analysis':
        return 'text-orange-600 bg-orange-50'
      case 'complete':
        return 'text-green-600 bg-green-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Activity Monitor</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time processing updates</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Activity className="h-8 w-8 mx-auto text-gray-300 mb-2" />
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
                  <p className="text-sm text-gray-900">{activity.message}</p>
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
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {activities.filter(a => a.type === 'file').length}
            </p>
            <p className="text-xs text-gray-500">Files</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {activities.filter(a => a.type === 'analysis').length}
            </p>
            <p className="text-xs text-gray-500">Analyses</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {activities.filter(a => a.type === 'complete').length}
            </p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>
      </div>
    </div>
  )
}