'use client'

import React, { useState } from 'react'
import { FileImportPanel } from './components/FileImportPanel'
import { ChatInterface } from './components/ChatInterface'
import { ActivityMonitor } from './components/ActivityMonitor'
import { LiveEstimatorView } from './components/LiveEstimatorView'
import { EstimatorHeader } from './components/EstimatorHeader'
import { EstimatorProvider } from './context/EstimatorContext'
import { ProjectConfiguration } from './components/ProjectConfiguration'

export default function SeniorEstimatorPage() {
  const [projectName, setProjectName] = useState('New Project')

  return (
    <EstimatorProvider>
      <div className="flex flex-col h-[calc(100vh-0px)] bg-dark-surface">
        {/* Header */}
        <EstimatorHeader 
          projectName={projectName}
          onProjectNameChange={setProjectName}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - 30% */}
          <div className="w-[30%] flex flex-col border-r border-gray-800">
            {/* Project Configuration - Top */}
            <div className="p-4 border-b border-gray-800">
              <ProjectConfiguration />
            </div>
            
            {/* File Import Panel - Middle */}
            <div className="flex-1 overflow-hidden">
              <FileImportPanel />
            </div>
            
            {/* Activity Monitor - Bottom */}
            <div className="h-[35%] border-t border-gray-800">
              <ActivityMonitor />
            </div>
          </div>
          
          {/* Center Column - Chat Interface - 40% */}
          <div className="w-[40%] border-r border-gray-800">
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