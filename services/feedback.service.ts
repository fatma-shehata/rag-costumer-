import { apiClient } from "@/lib/api-client"
import type { FeedbackRequest, FeedbackResponse } from "@/types"

export const feedbackService = {
  /**
   * POST /feedback/
   * Submit a rating (and optional comment) for a message.
   */
  submit: async (payload: FeedbackRequest): Promise<FeedbackResponse> => {
    const { data } = await apiClient.post<FeedbackResponse>("/feedback/", payload)
    return data
  },

  /**
   * GET /feedback/:message_id
   * Retrieve the feedback already submitted for a message.
   */
  get: async (message_id: number): Promise<FeedbackResponse> => {
    const { data } = await apiClient.get<FeedbackResponse>(`/feedback/${message_id}`)
    return data
  },
}