"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  chatService,
  normalizeAssistantMessage,
  normalizeConversationList,
  normalizeConversationMessages,
} from "@/services/chat.service"
import type { UIMessage, UIConversation } from "@/types"

// Format ISO date → "Apr 25, 2:39 AM"
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function useChat() {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [conversations, setConversations] = useState<UIConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const loadHistory = useCallback(async () => {
    try {
      const raw = await chatService.getHistory()
      setConversations(
        raw.map((c) => ({
          id: String(c.id),
          title: c.title,
          timestamp: formatTimestamp(c.created_at),
        }))
      )
    } catch (err) {
      console.error("[useChat] loadHistory:", err)
    }
  }, [])

  const selectConversation = useCallback(async (id: string) => {
    const numId = Number(id)
    setCurrentConversationId(numId)
    setError(null)
    try {
      const detail = await chatService.getConversation(numId)
      setMessages(normalizeConversationMessages(detail))
    } catch (err) {
      setError("Failed to load conversation")
      console.error("[useChat] selectConversation:", err)
    }
  }, [])

  const newChat = useCallback(() => {
    setMessages([])
    setCurrentConversationId(null)
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: UIMessage = {
        id: Date.now(),
        content,
        role: "user",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
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
        setMessages((prev) => [...prev, normalizeAssistantMessage(response)])
        if (!currentConversationId && response.conversation_id) {
          setCurrentConversationId(response.conversation_id)
        }
        await loadHistory()
      } catch (err: any) {
        setError(err.message ?? "Something went wrong. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [currentConversationId, loadHistory]
  )

  // ── Voice recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        const audioFile = new File([audioBlob], "voice.webm", { type: "audio/webm" })
        stream.getTracks().forEach((t) => t.stop())
        await sendVoiceFile(audioFile)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      setError("Microphone access denied. Please allow microphone permission.")
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const sendVoiceFile = useCallback(
    async (audio: File) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await chatService.voiceQuery({
          audio,
          conversation_id: currentConversationId ?? undefined,
          n_results: 3,
        })
        setMessages((prev) => [...prev, normalizeAssistantMessage(response)])
        if (!currentConversationId && response.conversation_id) {
          setCurrentConversationId(response.conversation_id)
        }
        await loadHistory()
      } catch (err: any) {
        setError("Voice query failed. Please try again.")
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
    isRecording,
    error,
    messagesEndRef,
    loadHistory,
    selectConversation,
    newChat,
    sendMessage,
    startRecording,
    stopRecording,
  }
}