"use client"

import { useState, useRef, useEffect } from "react"
import { Package, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { EmptyState } from "@/components/chat/empty-state"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  content: string
  role: "user" | "assistant"
  sources?: any[]
  timestamp: string
}

interface ChatHistory {
  id: string
  title: string
  timestamp: string
  isActive: boolean
  messages: Message[]
}

export default function ChatPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // load token + user
  useEffect(() => {
    setToken(localStorage.getItem("token"))
    const u = localStorage.getItem("user")
    if (u) setUser(JSON.parse(u))
  }, [])

  // load history
  const loadHistory = () => {
    if (!token) return

    fetch("http://127.0.0.1:8000/chat/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setChatHistory(
          data.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            timestamp: c.created_at,
            isActive: false,
            messages: [],
          }))
        )
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (token) loadHistory()
  }, [token])

  const handleNewChat = () => {
    setCurrentChatId(null)
    setMessages([])
    setIsMobileSidebarOpen(false)
  }

  // 🔥 تحميل رسائل الشات
  const handleSelectChat = async (id: string) => {
    setCurrentChatId(id)
    setIsMobileSidebarOpen(false)

    if (!token) return

    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      setMessages(
        data.messages.map((m: any) => ({
          id: Number(m.id),
          content: m.content,
          role: m.role,
          sources: m.sources || [],
          timestamp: new Date(m.created_at).toLocaleTimeString(),
        }))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!token) return

    const userMsg: Message = {
      id: Date.now(),
      content,
      role: "user",
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch("http://127.0.0.1:8000/chat/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: content,
          conversation_id: currentChatId ? Number(currentChatId) : 0,
          n_results: 3,
        }),
      })

      const data = await res.json()
      console.log("CHAT RESPONSE:", data)

      // ⚠️ check مهم
      if (!data.message_id) {
        console.error("❌ message_id missing from backend")
      }

      const botMsg: Message = {
        id: Number(data.message_id),
        content: data.answer,
        role: "assistant",
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString(),
      }

      setMessages((prev) => [...prev, botMsg])

      if (!currentChatId) {
        setCurrentChatId(String(data.conversation_id))
      }

      // تحديث الهستوري
      loadHistory()

    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ FIXED FEEDBACK
  const handleFeedback = (messageId: number, feedback: "up" | "down") => {
    if (!token) return

    const payload = {
      message_id: messageId,
      rating: feedback === "up" ? 1 : -1,
      comment: "", // ✅ مهم حسب API
    }

    console.log("FEEDBACK PAYLOAD:", payload)

    fetch("http://127.0.0.1:8000/feedback/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).catch(console.error)
  }

  return (
    <div className="flex h-screen bg-background">

      {/* Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          currentChatId={currentChatId}
        />
      </div>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ChatSidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          currentChatId={currentChatId}
        />
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-semibold">BrownBox AI</span>
          </div>

          {user && (
            <div className="text-sm text-muted-foreground">
              {user.username}
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  {...m}
                  onFeedback={handleFeedback}
                />
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}