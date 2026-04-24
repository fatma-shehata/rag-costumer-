"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  chatService,
  normalizeAssistantMessage,
  normalizeConversationList,
  normalizeConversationMessages,
} from "@/services/chat.service"
import type { UIMessage, UIConversation } from "@/types"

export function useChat() {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [conversations, setConversations] = useState<UIConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // ── Load conversation list ─────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const raw = await chatService.getHistory()
      setConversations(normalizeConversationList(raw))
    } catch (err: any) {
      console.error("[useChat] loadHistory:", err)
    }
  }, [])

  // ── Select a conversation ──────────────────────────────────────────────────
  const selectConversation = useCallback(async (id: string) => {
    const numId = Number(id)
    setCurrentConversationId(numId)
    setError(null)
    try {
      const detail = await chatService.getConversation(numId)
      setMessages(normalizeConversationMessages(detail))
    } catch (err: any) {
      setError("Failed to load conversation")
      console.error("[useChat] selectConversation:", err)
    }
  }, [])

  // ── Start a new chat ───────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    setMessages([])
    setCurrentConversationId(null)
    setError(null)
  }, [])

  // ── Send a text message ────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: UIMessage = {
        id: Date.now(),
        content,
        role: "user",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        const response = await chatService.ask({
          question: content,
          conversation_id: currentConversationId ?? 0,
          n_results: 3,
        })

        const assistantMsg = normalizeAssistantMessage(response)
        setMessages((prev) => [...prev, assistantMsg])

        // persist conversation id from first response
        if (!currentConversationId && response.conversation_id) {
          setCurrentConversationId(response.conversation_id)
        }

        await loadHistory()
      } catch (err: any) {
        const msg = err.response?.data?.detail ?? "Something went wrong. Please try again."
        setError(msg)
        console.error("[useChat] sendMessage:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [currentConversationId, loadHistory]
  )

  // ── Send a voice message ───────────────────────────────────────────────────
  const sendVoiceMessage = useCallback(
    async (audio: File) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await chatService.voiceQuery({
          audio,
          conversation_id: currentConversationId ?? undefined,
          n_results: 3,
        })

        // Add both the transcribed question (if any) and the AI answer
        const assistantMsg = normalizeAssistantMessage(response)
        setMessages((prev) => [...prev, assistantMsg])

        if (!currentConversationId && response.conversation_id) {
          setCurrentConversationId(response.conversation_id)
        }

        await loadHistory()
      } catch (err: any) {
        setError("Voice query failed. Please try again.")
        console.error("[useChat] sendVoiceMessage:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [currentConversationId, loadHistory]
  )

  return {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    error,
    messagesEndRef,
    loadHistory,
    selectConversation,
    newChat,
    sendMessage,
    sendVoiceMessage,
  }
}