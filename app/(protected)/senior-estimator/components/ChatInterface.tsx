'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Bot, User, AlertCircle } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'
import { FileAnalysisSummary } from './FileAnalysisSummary'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  attachments?: string[]
  analysisResult?: any
}


export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { 
    addActivity, 
    addEstimateItem, 
    updateJobDetails,
    updateScopeSummary,
    addTodoItem,
    projectConfig,
    sessionId,
    hasAnalyzedFiles
  } = useEstimator()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Check if project is configured
    if (!projectConfig.projectType || !projectConfig.location) {
      setError('Please configure your project type and location first')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setIsLoading(true)
    setError(null)

    // Add activity
    addActivity({
      type: 'chat',
      message: `User: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`
    })

    try {
      // Call the Senior Estimator API
      console.log('Calling main Senior Estimator API...')
      console.log('Debug - sessionId:', sessionId)
      console.log('Debug - hasAnalyzedFiles:', hasAnalyzedFiles)
      
      let response = await fetch('/api/senior-estimator/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId: sessionId,
          projectType: projectConfig.projectType,
          location: projectConfig.location,
          hasAnalyzedFiles: hasAnalyzedFiles
        }),
      })

      console.log('Main API response status:', response.status)

      // If main endpoint fails, try demo endpoint
      if (!response.ok && response.status === 500) {
        console.log('Main API failed with 500, trying demo mode...')
        response = await fetch('/api/senior-estimator/chat-demo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input,
            sessionId: sessionId,
            projectType: projectConfig.projectType,
            location: projectConfig.location,
            hasAnalyzedFiles: hasAnalyzedFiles
          }),
        })
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      console.log('API Response:', {
        sessionId: data.sessionId,
        analysisId: data.analysisId,
        demoMode: data.demoMode,
        intent: data.result?.intent,
        itemsFound: data.result?.scope_analysis?.extractedItems?.length || 0
      })
      
      // Session is now handled in context
      
      // Show demo mode warning if applicable
      if (data.demoMode) {
        console.log('Running in DEMO MODE')
        addActivity({
          type: 'response',
          message: '⚠️ Running in demo mode - results not saved to database'
        })
      } else {
        console.log('Running with FULL DATABASE persistence')
      }

      // Check if this is a non-construction query
      if (data.result?.intent && data.result.intent !== 'construction_scope') {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.result.message,
          sender: 'assistant',
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, aiResponse])
        
        addActivity({
          type: 'response',
          message: `Intent: ${data.result.intent}${data.result.hasAnalysis ? ' (found existing analysis)' : ''}`
        })
        
        return
      }

      // Process the estimation result
      const result = data.result
      
      // Update job details if extracted
      if (result.scope_analysis.extractedItems.length > 0) {
        updateJobDetails({
          projectType: projectConfig.projectType,
          location: projectConfig.location,
          estimatedCost: 0, // Will be calculated after pricing
          estimatedDays: parseInt(result.estimated_duration)
        })
      }

      // Add extracted items to estimates
      result.quote_items.forEach((item: any) => {
        addEstimateItem({
          id: item.id,
          category: item.category || 'General',
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.unitPrice || 0,
          total: item.totalPrice || 0,
          confidence: item.confidence.score >= 85 ? 'high' : 
                      item.confidence.score >= 70 ? 'medium' : 'low'
        })
      })

      // Update scope summary
      const scopeItems = result.scope_analysis.extractedItems.map((item: any) => 
        `${item.description} (${item.confidence.score}% confidence)`
      )
      updateScopeSummary(scopeItems)

      // Add next steps as todos
      result.next_steps.forEach((step: string) => {
        addTodoItem(step, 'medium')
      })

      // Create AI response message
      let responseContent = `I've analyzed your scope and found:\n\n`
      responseContent += `📋 **${result.scope_analysis.extractedItems.length} scope items** identified\n`
      responseContent += `🎯 **Overall confidence:** ${result.confidence_summary.overall_confidence.score}%\n`
      responseContent += `✅ **High confidence items:** ${result.confidence_summary.high_confidence_items}\n`
      responseContent += `⚠️ **Items needing review:** ${result.confidence_summary.items_requiring_review}\n\n`
      
      if (result.questions.length > 0) {
        responseContent += `I have **${result.questions.length} questions** to improve accuracy:\n`
        result.questions.slice(0, 3).forEach((q: any, idx: number) => {
          responseContent += `${idx + 1}. ${q.question}\n`
        })
        if (result.questions.length > 3) {
          responseContent += `\n...and ${result.questions.length - 3} more questions`
        }
      }
      
      responseContent += `\n\n**Estimated completion time:** ${result.estimated_duration}`

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        analysisResult: result
      }
      
      setMessages(prev => [...prev, aiResponse])
      
      addActivity({
        type: 'analysis',
        message: `Analyzed ${result.scope_analysis.extractedItems.length} items with ${result.confidence_summary.overall_confidence.score}% confidence`
      })

    } catch (err) {
      console.error('Error calling Senior Estimator API:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze scope')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while analyzing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      addActivity({
        type: 'error',
        message: 'Failed to analyze scope'
      })
    } finally {
      setIsTyping(false)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col bg-dark-elevated">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Chat Assistant</h2>
        <p className="text-sm text-gray-400 mt-1">Ask questions about your project</p>
      </div>

      {/* File Analysis Summary */}
      <div className="px-4 pt-4">
        <FileAnalysisSummary />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Bot className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Start a conversation</h3>
              <p className="text-sm text-gray-500">
                Type your project scope or upload drawings to begin analysis
              </p>
            </div>
          </div>
        ) : (
          messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-electric-magenta rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-dark-surface border border-gray-700 text-white'
                  : 'bg-dark-surface border border-gray-800 text-gray-300'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
          ))
        )}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-electric-magenta rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-dark-surface border border-gray-800 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-electric-magenta rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-electric-magenta rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-electric-magenta rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-lg bg-dark-surface border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric-magenta"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-electric-magenta text-white rounded-lg px-4 py-2 hover:bg-electric-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="sr-only">Analyzing...</span>
              </>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}