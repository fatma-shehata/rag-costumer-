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

// ─── Raw API calls ────────────────────────────────────────────────────────────

export const chatService = {
  /**
   * POST /chat/ask
   * Send a text question and get an AI answer.
   */
  ask: async (payload: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>("/chat/ask", payload)
    return data
  },

  /**
   * POST /chat/voice
   * Send an audio file and get an AI answer (multipart/form-data).
   */
  voiceQuery: async ({
    audio,
    conversation_id,
    n_results,
  }: VoiceQueryParams): Promise<ChatResponse> => {
    const form = new FormData()
    form.append("audio", audio)
    if (conversation_id !== undefined) form.append("conversation_id", String(conversation_id))
    if (n_results !== undefined) form.append("n_results", String(n_results))

    const { data } = await apiClient.post<ChatResponse>("/chat/voice", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data
  },

  /**
   * GET /chat/history
   * List all conversations for the current user.
   */
  getHistory: async (): Promise<ConversationListItem[]> => {
    const { data } = await apiClient.get<ConversationListItem[]>("/chat/history")
    return data
  },

  /**
   * GET /chat/history/:id
   * Get full conversation with all messages.
   */
  getConversation: async (id: number): Promise<ConversationDetail> => {
    const { data } = await apiClient.get<ConversationDetail>(`/chat/history/${id}`)
    return data
  },
}

// ─── UI normalizers (raw API → UI shapes) ─────────────────────────────────────

/**
 * Converts a raw ChatResponse into a UIMessage for the assistant bubble.
 */
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

/**
 * Converts ConversationListItem[] → UIConversation[] for the sidebar.
 */
export function normalizeConversationList(
  raw: ConversationListItem[]
): UIConversation[] {
  return raw.map((c) => ({
    id: String(c.id),
    title: c.title,
    timestamp: c.created_at,
  }))
}

/**
 * Converts a ConversationDetail's messages → UIMessage[] for the chat window.
 * The API stores user query + LLM response as one row, so we expand each to 2 bubbles.
 */
export function normalizeConversationMessages(
  detail: ConversationDetail
): UIMessage[] {
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