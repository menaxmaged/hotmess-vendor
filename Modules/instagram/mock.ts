/**
 * Instagram Feature - Mock Data
 */

import { mockDelay } from "@/lib/mock-utils";
import type { ConnectInstagramInput, InstagramConnection, InstagramGrid } from "./types";

const portfolio: InstagramGrid = {
  connected: true,
  cached: true,
  posts: [
    {
      id: "post-1",
      mediaType: "IMAGE",
      mediaUrl: "https://picsum.photos/seed/ig-1/400/400",
      thumbnailUrl: null,
      permalink: "https://www.instagram.com/p/mock1/",
      caption: "Sunset ceremony at the Manial Palace.",
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "post-2",
      mediaType: "IMAGE",
      mediaUrl: "https://picsum.photos/seed/ig-2/400/400",
      thumbnailUrl: null,
      permalink: "https://www.instagram.com/p/mock2/",
      caption: null,
      timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ],
};

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

  getPortfolio: async (_vendorId: string): Promise<InstagramGrid> => {
    await mockDelay(300);
    return connection.connected ? { ...portfolio } : { connected: false, posts: [], cached: false };
  },
};
