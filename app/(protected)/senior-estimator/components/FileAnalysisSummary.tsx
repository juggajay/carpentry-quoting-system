'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Eye, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useEstimator } from '../context/EstimatorContext'

interface AnalysisSummary {
  fileCount: number
  pageCount: number
  drawingType: string
  elementsFound: string[]
  textContent: string
  confidence: number
  recommendations: string[]
}

export function FileAnalysisSummary() {
  const { sessionId, hasAnalyzedFiles } = useEstimator()
  const [summary, setSummary] = useState<AnalysisSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasAnalyzedFiles && sessionId) {
      fetchAnalysisSummary()
    }
  }, [hasAnalyzedFiles, sessionId])

  const fetchAnalysisSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/senior-estimator/analysis-summary?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch analysis summary:', error)
    }
    setLoading(false)
  }

  if (!hasAnalyzedFiles) {
    return null
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-electric-magenta" />
          What I See in Your Files
        </CardTitle>
        <CardDescription>AI analysis of uploaded documents</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-8 w-8 border-2 border-electric-magenta border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-400 mt-2">Analyzing files...</p>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* File Overview */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{summary.fileCount} files</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-300">{summary.pageCount} pages</span>
              </div>
              <Badge variant={summary.confidence > 70 ? 'success' : 'warning'}>
                {summary.confidence}% confidence
              </Badge>
            </div>

            {/* Document Type */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">Document Type</h4>
              <p className="text-sm text-white">{summary.drawingType}</p>
            </div>

            {/* Elements Found */}
            {summary.elementsFound.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Elements Detected</h4>
                <div className="flex flex-wrap gap-2">
                  {summary.elementsFound.map((element, index) => (
                    <Badge key={index} variant="default" className="text-xs">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Text Content Preview */}
            {summary.textContent && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-1">Content Preview</h4>
                <p className="text-xs text-gray-400 bg-dark-surface p-2 rounded">
                  {summary.textContent.substring(0, 200)}...
                </p>
              </div>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <div className="border-t border-gray-800 pt-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-info-blue" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-info-blue mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No analysis summary available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}