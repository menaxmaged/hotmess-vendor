/**
 * Account Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { AccountDeletion, Me, UpdateMeInput } from "./types";

let me: Me = {
  id: "mock-vendor-1",
  email: "vendor@hotmess.dev",
  name: "Amira Studio",
  phone: "+20 100 000 0000",
  accountType: "vendor",
  status: "active",
  localePref: "en",
  createdAt: "2026-06-01T10:00:00.000Z",
};

export const mockAccountApi = {
  getMe: async (): Promise<Me> => {
    await mockDelay();
    return me;
  },

  updateMe: async (input: UpdateMeInput): Promise<Me> => {
    await mockDelay();
    me = { ...me, ...input };
    return me;
  },

  deleteMe: async (): Promise<AccountDeletion> => {
    await mockDelay();
    const deletedAt = new Date();
    const purgeAt = new Date(deletedAt.getTime() + 30 * 86400000);
    return { deletedAt: deletedAt.toISOString(), purgeAt: purgeAt.toISOString() };
  },
};
