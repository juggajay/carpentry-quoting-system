'use client'

import React, { useState, useEffect } from 'react'
import { X, HelpCircle, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface Question {
  id: string
  question: string
  questionType: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  context: any
  defaultAnswer: string
  options?: { text: string; value: string }[]
  status: 'PENDING' | 'ANSWERED'
  answer?: string
}

interface QuestionsDialogProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  analysisId?: string
}

export function QuestionsDialog({ isOpen, onClose, sessionId, analysisId }: QuestionsDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchQuestions()
    }
  }, [isOpen, sessionId])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const url = analysisId 
        ? `/api/senior-estimator/questions?sessionId=${sessionId}&analysisId=${analysisId}`
        : `/api/senior-estimator/questions?sessionId=${sessionId}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    }
    setLoading(false)
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const submitAnswer = async (questionId: string) => {
    const answer = answers[questionId]
    if (!answer) return

    try {
      const response = await fetch(`/api/senior-estimator/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      })

      if (response.ok) {
        // Update local state
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, status: 'ANSWERED', answer } : q
        ))
        
        // Move to next question
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
    }
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = questions.filter(q => q.status === 'ANSWERED').length

  if (!isOpen) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error'
      case 'MEDIUM': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-elevated rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-electric-magenta" />
              <div>
                <h2 className="text-xl font-semibold text-white">Clarification Questions</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Answer these to improve estimate accuracy
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">{answeredCount} / {questions.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-electric-magenta h-2 rounded-full transition-all"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-electric-magenta border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-400 mt-2">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success-green mx-auto mb-3" />
              <p className="text-lg text-white mb-2">No questions needed!</p>
              <p className="text-sm text-gray-400">The AI has sufficient information to proceed.</p>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center gap-3">
                <Badge variant={getPriorityColor(currentQuestion.priority)}>
                  {currentQuestion.priority}
                </Badge>
                <Badge variant="default">
                  {currentQuestion.questionType}
                </Badge>
                <span className="text-sm text-gray-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Question */}
              <div className="bg-dark-surface rounded-lg p-4">
                <h3 className="text-lg text-white mb-2">{currentQuestion.question}</h3>
                
                {/* Context if available */}
                {currentQuestion.context?.scope_item && (
                  <div className="mt-3 p-3 bg-gray-800/50 rounded text-sm text-gray-300">
                    <p className="font-medium mb-1">Related to:</p>
                    <p>{currentQuestion.context.scope_item.description}</p>
                  </div>
                )}
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options ? (
                  // Multiple choice
                  currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        answers[currentQuestion.id] === option.value
                          ? 'border-electric-magenta bg-electric-magenta/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-sm text-white">{option.text}</p>
                    </button>
                  ))
                ) : (
                  // Text input
                  <textarea
                    value={answers[currentQuestion.id] || currentQuestion.defaultAnswer || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-3 bg-dark-surface border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-magenta focus:outline-none resize-none"
                    rows={3}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                
                <button
                  onClick={() => submitAnswer(currentQuestion.id)}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-electric-magenta text-white px-6 py-2 rounded-lg font-medium hover:bg-electric-magenta/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    'Finish'
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}