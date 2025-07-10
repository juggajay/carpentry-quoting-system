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

interface JobDetails {
  jobNumber?: string
  client?: string
  location?: string
  startDate?: string
  projectType?: string
  estimatedCost?: number
  estimatedDays?: number
}

interface TodoItem {
  id: string
  task: string
  completed: boolean
  priority?: 'high' | 'medium' | 'low'
}

interface ProjectConfig {
  projectType?: 'residential' | 'commercial' | 'industrial'
  location?: string
}

interface EstimatorContextType {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void
  estimateItems: EstimateItem[]
  addEstimateItem: (item: EstimateItem) => void
  updateEstimateItem: (id: string, updates: Partial<EstimateItem>) => void
  removeEstimateItem: (id: string) => void
  jobDetails: JobDetails
  updateJobDetails: (details: Partial<JobDetails>) => void
  scopeSummary: string[]
  updateScopeSummary: (summary: string[]) => void
  todoItems: TodoItem[]
  addTodoItem: (task: string, priority?: 'high' | 'medium' | 'low') => void
  toggleTodoItem: (id: string) => void
  removeTodoItem: (id: string) => void
  projectConfig: ProjectConfig
  updateProjectConfig: (config: ProjectConfig) => void
}

const EstimatorContext = createContext<EstimatorContextType | undefined>(undefined)

export function EstimatorProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([])
  const [jobDetails, setJobDetails] = useState<JobDetails>({})
  const [scopeSummary, setScopeSummary] = useState<string[]>([])
  const [todoItems, setTodoItems] = useState<TodoItem[]>([])
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({})

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

  const updateJobDetails = (details: Partial<JobDetails>) => {
    setJobDetails(prev => ({ ...prev, ...details }))
  }

  const updateScopeSummary = (summary: string[]) => {
    setScopeSummary(summary)
  }

  const addTodoItem = (task: string, priority?: 'high' | 'medium' | 'low') => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      task,
      completed: false,
      priority
    }
    setTodoItems(prev => [...prev, newTodo])
    addActivity({
      type: 'analysis',
      message: `Added task: ${task}`
    })
  }

  const toggleTodoItem = (id: string) => {
    setTodoItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const removeTodoItem = (id: string) => {
    setTodoItems(prev => prev.filter(item => item.id !== id))
  }

  const updateProjectConfig = (config: ProjectConfig) => {
    setProjectConfig(config)
    addActivity({
      type: 'analysis',
      message: `Updated project configuration: ${config.projectType} in ${config.location}`
    })
  }

  return (
    <EstimatorContext.Provider 
      value={{
        activities,
        addActivity,
        estimateItems,
        addEstimateItem,
        updateEstimateItem,
        removeEstimateItem,
        jobDetails,
        updateJobDetails,
        scopeSummary,
        updateScopeSummary,
        todoItems,
        addTodoItem,
        toggleTodoItem,
        removeTodoItem,
        projectConfig,
        updateProjectConfig
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