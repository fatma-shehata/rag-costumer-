"use client"

import { useEffect } from "react"
import { Package, Mic, MicOff } from "lucide-react"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { EmptyState } from "@/components/chat/empty-state"
import { useAuth } from "@/hooks/useAuth"
import { useChat } from "@/hooks/useChat"
import { useFeedback } from "@/hooks/useFeedback"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const { user } = useAuth()
  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isRecording,
    error,
    messagesEndRef,
    loadHistory,
    selectConversation,
    newChat,
    sendMessage,
    startRecording,
    stopRecording,
  } = useChat()
  const { submit: submitFeedback } = useFeedback()

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleFeedback = async (messageId: number, rating: number) => {
    await submitFeedback(messageId, rating)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          chatHistory={conversations.map((c) => ({
            id: c.id,
            title: c.title,
            timestamp: c.timestamp,
            isActive: c.id === String(currentConversationId),
            messages: [],
          }))}
          onNewChat={newChat}
          onSelectChat={selectConversation}
          currentChatId={currentConversationId ? String(currentConversationId) : null}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between p-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-semibold">BrownBox AI</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Voice button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              title={isRecording ? "Stop recording" : "Voice message"}
              className={cn(isRecording && "text-red-500 animate-pulse")}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {user && (
              <span className="text-sm text-muted-foreground">{user.username}</span>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={sendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 pb-4">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  {...m}
                  onFeedback={(rating: number) => handleFeedback(m.id, rating)}
                />
              ))}
              {isLoading && <TypingIndicator />}
              {isRecording && (
                <p className="text-sm text-red-500 text-center py-2 animate-pulse">
                  🎙️ Recording... tap the mic again to send
                </p>
              )}
              {error && (
                <p className="text-sm text-red-500 text-center py-2">{error}</p>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}