/**
 * Saved Replies Feature - Mock Data
 */

import { mockDelay, mockId } from "@/lib/mock-utils";
import type { CreateSavedReplyInput, SavedReply } from "./types";

const replies: SavedReply[] = [
  { id: "reply-1", title: "Pricing", body: "Our packages start at 8,500 EGP." },
  { id: "reply-2", title: "Availability", body: "Let me check our calendar and get back to you within the day." },
];

export const mockSavedRepliesApi = {
  getSavedReplies: async (): Promise<SavedReply[]> => {
    await mockDelay();
    return [...replies];
  },

  createSavedReply: async (input: CreateSavedReplyInput): Promise<SavedReply> => {
    await mockDelay(250);
    const created: SavedReply = { id: mockId(), title: input.title, body: input.body };
    replies.push(created);
    return created;
  },

  deleteSavedReply: async (id: string): Promise<void> => {
    await mockDelay(200);
    const index = replies.findIndex((r) => r.id === id);
    if (index !== -1) replies.splice(index, 1);
  },
};
