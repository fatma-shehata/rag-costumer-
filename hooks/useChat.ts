"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  chatService,
  normalizeAssistantMessage,
  normalizeConversationMessages,
} from "@/services/chat.service"
import type { UIMessage, UIConversation } from "@/types"

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function now(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
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
      const res = await chatService.getHistory()
      // backend may return array or wrapped object
      const raw: any[] = Array.isArray(res)
        ? res
        : (res as any)?.conversations ?? (res as any)?.data ?? []
      setConversations(
        raw.map((c: any) => ({
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
    setCurrentConversationId(Number(id))
    setError(null)
    try {
      const detail = await chatService.getConversation(Number(id))
      setMessages(normalizeConversationMessages(detail))
    } catch {
      setError("Failed to load conversation")
    }
  }, [])

  const newChat = useCallback(() => {
    setMessages([])
    setCurrentConversationId(null)
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), content, role: "user", timestamp: now() },
      ])
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
        setError(err.message ?? "Something went wrong.")
      } finally {
        setIsLoading(false)
      }
    },
    [currentConversationId, loadHistory]
  )

  const sendVoiceFile = useCallback(
    async (audio: File) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), content: "🎙️ Voice message", role: "user", timestamp: now() },
      ])
      setIsLoading(true)
      setError(null)
      try {
        const text = await chatService.voiceQuery({
          audio,
          conversation_id: currentConversationId ?? undefined,
          n_results: 3,
        })
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            content: typeof text === "string" ? text : "No response from server",
            role: "assistant",
            timestamp: now(),
          },
        ])
        await loadHistory()
      } catch {
        setError("Voice query failed. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [currentConversationId, loadHistory]
  )

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
      setError("Microphone access denied.")
    }
  }, [sendVoiceFile])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

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