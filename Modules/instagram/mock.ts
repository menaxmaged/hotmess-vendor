/**
 * Instagram Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { ConnectInstagramInput, InstagramConnection } from "./types";

let connection: InstagramConnection = {
  connected: true,
  igUserId: "17841400000000000",
  lastSyncAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  disconnectedAt: null,
  configured: true,
};

export const mockInstagramApi = {
  getConnection: async (): Promise<InstagramConnection> => {
    await mockDelay();
    return { ...connection };
  },

  connect: async (_input: ConnectInstagramInput): Promise<InstagramConnection> => {
    await mockDelay(500);
    connection = {
      connected: true,
      igUserId: "17841400000000000",
      lastSyncAt: new Date().toISOString(),
      disconnectedAt: null,
      configured: true,
    };
    return { ...connection };
  },

  disconnect: async (): Promise<InstagramConnection> => {
    await mockDelay(250);
    connection = {
      connected: false,
      igUserId: null,
      lastSyncAt: connection.lastSyncAt,
      disconnectedAt: new Date().toISOString(),
      configured: true,
    };
    return { ...connection };
  },
};
