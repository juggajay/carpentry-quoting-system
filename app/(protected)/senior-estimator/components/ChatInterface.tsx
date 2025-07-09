'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Bot, User } from 'lucide-react'
import { useEstimator } from '../context/EstimatorContext'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  attachments?: string[]
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Senior Estimator. Upload your project files and I\'ll help you analyze scope, quantities, and generate accurate estimates.',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addActivity } = useEstimator()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Add activity
    addActivity({
      type: 'chat',
      message: `User: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`
    })

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I\'ve received your message. Let me analyze the information and provide you with detailed insights.',
        sender: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      
      addActivity({
        type: 'response',
        message: 'AI provided analysis'
      })
    }, 2000)
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
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
        ))}

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
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-electric-magenta text-white rounded-lg px-4 py-2 hover:bg-electric-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}