'use client'

import React, { useState } from 'react'
import { Building2, FileText, CheckSquare, Square, Hash, Calendar, MapPin, Users } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function LiveEstimatorView() {
  const { jobDetails, scopeSummary, todoItems, toggleTodoItem } = useEstimator()
  const [activeTab, setActiveTab] = useState<'details' | 'scope' | 'todos'>('details')

  return (
    <div className="h-full flex flex-col bg-dark-elevated">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-electric-magenta border-b-2 border-electric-magenta'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          Job Details
        </button>
        <button
          onClick={() => setActiveTab('scope')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'scope'
              ? 'text-electric-magenta border-b-2 border-electric-magenta'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Scope Summary
        </button>
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'todos'
              ? 'text-electric-magenta border-b-2 border-electric-magenta'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CheckSquare className="h-4 w-4 inline mr-2" />
          Todo List
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
                <CardDescription>Key details about this estimation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Job Number</p>
                    <p className="text-sm text-white font-medium">{jobDetails.jobNumber || 'JOB-2024-001'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Client</p>
                    <p className="text-sm text-white font-medium">{jobDetails.client || 'TBC'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm text-white font-medium">{jobDetails.location || 'TBC'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-sm text-white font-medium">{jobDetails.startDate || 'TBC'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Project Type</p>
                    <p className="text-sm text-white font-medium">{jobDetails.projectType || 'Residential'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Estimated Cost</p>
                    <p className="text-xl font-bold text-electric-magenta">
                      ${jobDetails.estimatedCost?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="text-xl font-bold text-vibrant-cyan">
                      {jobDetails.estimatedDays || '0'} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'scope' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scope of Work</CardTitle>
                <CardDescription>AI-generated summary from uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                {scopeSummary.length === 0 ? (
                  <p className="text-gray-400 text-sm">No scope summary yet. Upload project files to generate.</p>
                ) : (
                  <div className="space-y-3">
                    {scopeSummary.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <Badge variant="primary" className="mt-0.5">{index + 1}</Badge>
                        <p className="text-sm text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estimation Tasks</CardTitle>
                <CardDescription>Items requiring attention from the Senior Estimator</CardDescription>
              </CardHeader>
              <CardContent>
                {todoItems.length === 0 ? (
                  <p className="text-gray-400 text-sm">No tasks yet. Tasks will appear as you analyze documents.</p>
                ) : (
                  <div className="space-y-2">
                    {todoItems.map(todo => (
                      <div
                        key={todo.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-dark-surface border border-gray-800 hover:border-gray-700 transition-colors"
                      >
                        <button
                          onClick={() => toggleTodoItem(todo.id)}
                          className="mt-0.5"
                        >
                          {todo.completed ? (
                            <CheckSquare className="h-4 w-4 text-success-green" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400 hover:text-electric-magenta" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm ${todo.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {todo.task}
                          </p>
                          {todo.priority && (
                            <Badge
                              variant={todo.priority === 'high' ? 'error' : todo.priority === 'medium' ? 'warning' : 'default'}
                              className="mt-1"
                            >
                              {todo.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}