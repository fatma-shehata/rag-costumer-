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
  id: string
  content: string
  role: "user" | "assistant"
  sources?: { title: string; url: string }[]
  timestamp: string
}

interface ChatHistory {
  id: string
  title: string
  timestamp: string
  isActive: boolean
  messages: Message[]
}

// Mock data for chat history
const mockChatHistory: ChatHistory[] = [
  {
    id: "1",
    title: "Order tracking inquiry",
    timestamp: "Today",
    isActive: false,
    messages: [
      { id: "1-1", content: "Where is my order #12345?", role: "user", timestamp: "10:30 AM" },
      {
        id: "1-2",
        content: "I found your order #12345! It's currently in transit and expected to arrive by March 21st. You can track it using the tracking number: BB1234567890.",
        role: "assistant",
        sources: [
          { title: "Order Tracking FAQ", url: "#" },
          { title: "Shipping Policy", url: "#" },
        ],
        timestamp: "10:30 AM",
      },
    ],
  },
  {
    id: "2",
    title: "Return policy question",
    timestamp: "Yesterday",
    isActive: false,
    messages: [
      { id: "2-1", content: "What is your return policy?", role: "user", timestamp: "2:15 PM" },
      {
        id: "2-2",
        content: "Our return policy allows you to return most items within 30 days of delivery. Items must be unused and in original packaging. To initiate a return, go to your Orders page and select 'Return Item'.",
        role: "assistant",
        sources: [{ title: "Return Policy", url: "#" }],
        timestamp: "2:15 PM",
      },
    ],
  },
  {
    id: "3",
    title: "Payment issue",
    timestamp: "Mar 15",
    isActive: false,
    messages: [],
  },
]

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>(mockChatHistory)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleNewChat = () => {
    setCurrentChatId(null)
    setMessages([])
    setIsMobileSidebarOpen(false)
  }

  const handleSelectChat = (id: string) => {
    const chat = chatHistory.find((c) => c.id === id)
    if (chat) {
      setCurrentChatId(id)
      setMessages(chat.messages)
    }
    setIsMobileSidebarOpen(false)
  }

  const handleSendMessage = async (content: string) => {
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)

    // Simulate API call - replace with actual POST /chat/ask
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const aiResponse: Message = {
      id: `msg-${Date.now() + 1}`,
      content: getAIResponse(content),
      role: "assistant",
      sources: [
        { title: "BrownBox Help Center", url: "#" },
        { title: "Customer Support Guide", url: "#" },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, aiResponse])
    setIsLoading(false)

    // Update chat history if it's a new chat
    if (!currentChatId) {
      const newChatId = `chat-${Date.now()}`
      const newChat: ChatHistory = {
        id: newChatId,
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        timestamp: "Just now",
        isActive: true,
        messages: [newUserMessage, aiResponse],
      }
      setChatHistory((prev) => [newChat, ...prev])
      setCurrentChatId(newChatId)
    }
  }

  const handleFeedback = (messageId: string, feedback: "up" | "down", comment?: string) => {
    console.log("Feedback received:", { messageId, feedback, comment })
    // Implement feedback API call here
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          currentChatId={currentChatId}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300",
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Package className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">BrownBox AI Support</h1>
                <p className="text-xs text-muted-foreground">Always here to help</p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSendMessage} />
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  {...message}
                  onFeedback={handleFeedback}
                />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}

// Mock AI responses based on keywords
function getAIResponse(question: string): string {
  const q = question.toLowerCase()

  if (q.includes("return")) {
    return "To return a product, please follow these steps:\n\n1. Go to your Orders page in your account\n2. Find the order containing the item you want to return\n3. Click 'Return Item' and select a reason\n4. Print the prepaid shipping label\n5. Pack the item in its original packaging and drop it off at any authorized shipping location\n\nRefunds are typically processed within 5-7 business days after we receive the returned item."
  }

  if (q.includes("order") || q.includes("where")) {
    return "I'd be happy to help you track your order! To provide accurate tracking information, I'll need your order number. You can find this in your order confirmation email or in your account under 'Orders'.\n\nOnce you provide the order number, I can give you real-time updates on your shipment status."
  }

  if (q.includes("password")) {
    return "To change your password:\n\n1. Click on your profile icon in the top right corner\n2. Select 'Account Settings'\n3. Navigate to 'Security'\n4. Click 'Change Password'\n5. Enter your current password and then your new password twice\n6. Click 'Save Changes'\n\nMake sure your new password is at least 8 characters and includes a mix of letters, numbers, and symbols."
  }

  if (q.includes("payment") || q.includes("pay")) {
    return "We accept the following payment methods:\n\n• Credit/Debit Cards (Visa, Mastercard, American Express)\n• PayPal\n• Apple Pay\n• Google Pay\n• BrownBox Gift Cards\n• Buy Now, Pay Later (Klarna, Afterpay)\n\nAll transactions are secured with industry-standard encryption."
  }

  if (q.includes("shipping") || q.includes("delivery")) {
    return "Our shipping options include:\n\n• Standard Shipping (5-7 business days): Free on orders over $50\n• Express Shipping (2-3 business days): $9.99\n• Next Day Delivery: $19.99 (order before 2 PM)\n\nDelivery times may vary based on your location. You'll receive a tracking number once your order ships."
  }

  if (q.includes("contact") || q.includes("support") || q.includes("help")) {
    return "I'm here to help! For additional support, you can:\n\n• Continue chatting with me for instant answers\n• Email us at support@brownbox.com\n• Call us at 1-800-BROWN-BOX (Mon-Fri, 9 AM - 6 PM EST)\n• Visit our Help Center for FAQs and guides\n\nWhat specific issue can I help you with today?"
  }

  return "Thank you for your question! I'm here to help with anything related to:\n\n• Order tracking and status\n• Returns and refunds\n• Shipping and delivery\n• Account management\n• Payment issues\n• Product information\n\nCould you please provide more details about what you need help with?"
}
