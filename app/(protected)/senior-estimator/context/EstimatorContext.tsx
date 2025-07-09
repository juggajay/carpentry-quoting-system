'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface Activity {
  id: string
  type: 'file' | 'chat' | 'analysis' | 'complete' | 'error' | 'response'
  message: string
  timestamp: Date
}

interface EstimateItem {
  id: string
  category: string
  description: string
  quantity: number
  unit: string
  rate: number
  total: number
  confidence: 'high' | 'medium' | 'low'
}

interface EstimatorContextType {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void
  estimateItems: EstimateItem[]
  addEstimateItem: (item: EstimateItem) => void
  updateEstimateItem: (id: string, updates: Partial<EstimateItem>) => void
  removeEstimateItem: (id: string) => void
}

const EstimatorContext = createContext<EstimatorContextType | undefined>(undefined)

export function EstimatorProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([])

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setActivities(prev => [newActivity, ...prev].slice(0, 50)) // Keep last 50 activities
  }

  const addEstimateItem = (item: EstimateItem) => {
    setEstimateItems(prev => [...prev, item])
    addActivity({
      type: 'analysis',
      message: `Added estimate: ${item.description}`
    })
  }

  const updateEstimateItem = (id: string, updates: Partial<EstimateItem>) => {
    setEstimateItems(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    )
  }

  const removeEstimateItem = (id: string) => {
    setEstimateItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <EstimatorContext.Provider 
      value={{
        activities,
        addActivity,
        estimateItems,
        addEstimateItem,
        updateEstimateItem,
        removeEstimateItem
      }}
    >
      {children}
    </EstimatorContext.Provider>
  )
}

export function useEstimator() {
  const context = useContext(EstimatorContext)
  if (!context) {
    throw new Error('useEstimator must be used within EstimatorProvider')
  }
  return context
}