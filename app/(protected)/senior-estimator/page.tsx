'use client'

import React, { useState } from 'react'
import { FileImportPanel } from './components/FileImportPanel'
import { ChatInterface } from './components/ChatInterface'
import { ActivityMonitor } from './components/ActivityMonitor'
import { LiveEstimatorView } from './components/LiveEstimatorView'
import { EstimatorHeader } from './components/EstimatorHeader'
import { EstimatorProvider } from './context/EstimatorContext'

export default function SeniorEstimatorPage() {
  const [estimatorMode, setEstimatorMode] = useState<'senior' | 'junior'>('senior')
  const [projectName, setProjectName] = useState('New Project')

  return (
    <EstimatorProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <EstimatorHeader 
          projectName={projectName}
          estimatorMode={estimatorMode}
          onModeToggle={setEstimatorMode}
          onProjectNameChange={setProjectName}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - 30% */}
          <div className="w-[30%] flex flex-col border-r border-gray-200">
            {/* File Import Panel - Top */}
            <div className="flex-1 overflow-hidden">
              <FileImportPanel />
            </div>
            
            {/* Activity Monitor - Bottom */}
            <div className="h-[40%] border-t border-gray-200">
              <ActivityMonitor />
            </div>
          </div>
          
          {/* Center Column - Chat Interface - 40% */}
          <div className="w-[40%] border-r border-gray-200">
            <ChatInterface />
          </div>
          
          {/* Right Column - Live Estimator View - 30% */}
          <div className="w-[30%]">
            <LiveEstimatorView />
          </div>
        </div>
      </div>
    </EstimatorProvider>
  )
}