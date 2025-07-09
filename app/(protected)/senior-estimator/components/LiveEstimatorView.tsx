'use client'

import React, { useState } from 'react'
import { TrendingUp, DollarSign, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'

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

export function LiveEstimatorView() {
  const { estimateItems } = useEstimator()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const groupedItems = estimateItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, EstimateItem[]>)

  const totalEstimate = estimateItems.reduce((sum, item) => sum + item.total, 0)
  const highConfidenceItems = estimateItems.filter(item => item.confidence === 'high').length
  const estimatedDays = Math.ceil(totalEstimate / 5000) // Rough calculation

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Live Estimate</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time cost calculations</p>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Total Estimate</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ${totalEstimate.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Confidence</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {totalEstimate > 0 
              ? Math.round((highConfidenceItems / estimateItems.length) * 100) 
              : 0}%
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Est. Duration</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {estimatedDays} days
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Items</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {estimateItems.length}
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Object.entries(groupedItems).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <TrendingUp className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No estimates yet</p>
            <p className="text-xs mt-1">Upload files to begin estimation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedItems).map(([category, items]) => {
              const categoryTotal = items.reduce((sum, item) => sum + item.total, 0)
              const isExpanded = expandedCategories.has(category)

              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="text-sm text-gray-500">({items.length})</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${categoryTotal.toLocaleString()}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="px-4 py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm text-gray-900 flex-1">{item.description}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ml-2 ${getConfidenceColor(item.confidence)}`}>
                              {item.confidence}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{item.quantity} {item.unit} @ ${item.rate}</span>
                            <span className="font-medium text-gray-700">
                              ${item.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}