import { apiClient } from "@/lib/api-client"
import type {
  ChatRequest,
  ChatResponse,
  ConversationListItem,
  ConversationDetail,
  VoiceQueryParams,
  UIMessage,
  UIConversation,
} from "@/types"

export const chatService = {
  ask: async (payload: ChatRequest): Promise<ChatResponse> => {
    return (await apiClient.post<ChatResponse>("/chat/ask", payload)).data
  },

  voiceQuery: async ({ audio, conversation_id, n_results }: VoiceQueryParams): Promise<ChatResponse> => {
    const form = new FormData()
    form.append("audio", audio)
    if (conversation_id !== undefined) form.append("conversation_id", String(conversation_id))
    if (n_results !== undefined) form.append("n_results", String(n_results))
    return (await apiClient.post<ChatResponse>("/chat/voice", form)).data
  },

  getHistory: async (): Promise<ConversationListItem[]> => {
    return (await apiClient.get<ConversationListItem[]>("/chat/history")).data
  },

  getConversation: async (id: number): Promise<ConversationDetail> => {
    return (await apiClient.get<ConversationDetail>(`/chat/history/${id}`)).data
  },
}

export function normalizeAssistantMessage(raw: ChatResponse): UIMessage {
  return {
    id: raw.message_id ?? Date.now(),
    content: raw.answer ?? raw.response ?? "No response from server",
    role: "assistant",
    sources: raw.sources?.map((s) => ({
      title: s.title ?? s.category ?? "Source",
      url: s.url ?? "#",
    })),
    timestamp: new Date().toLocaleTimeString(),
  }
}

export function normalizeConversationList(raw: ConversationListItem[]): UIConversation[] {
  return raw.map((c) => ({
    id: String(c.id),
    title: c.title,
    timestamp: c.created_at,
  }))
}

export function normalizeConversationMessages(detail: ConversationDetail): UIMessage[] {
  return detail.messages.flatMap((m) => [
    {
      id: m.id * 10,
      content: m.user_query,
      role: "user" as const,
      timestamp: new Date(m.created_at).toLocaleTimeString(),
    },
    {
      id: m.id * 10 + 1,
      content: m.llm_response,
      role: "assistant" as const,
      timestamp: new Date(m.created_at).toLocaleTimeString(),
    },
  ])
}