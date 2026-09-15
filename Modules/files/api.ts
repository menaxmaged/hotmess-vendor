/**
 * Files Feature - API Service
 *
 * One place for the upload → id round-trip that chat attachments, ad
 * creatives and studio media all share. Accepted MIME types are jpeg, png,
 * webp, gif and pdf; anything else is refused server-side.
 */

import { api, apiClient, apiFormData, USE_MOCK_DATA } from "@/lib/api-client";
import type { OutgoingFile, StorageUsage, StoredFile, UploadKind } from "./types";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = c.data ?? c.item ?? c.result;
    if (nested !== undefined) return nested as T;
    return c as T;
  }
  return payload as T;
};

const isAbsolute = (url: string) => /^https?:\/\//i.test(url);

/** The API origin: the client's baseURL minus its `/v1` suffix. */
const apiOrigin = () => (apiClient.defaults.baseURL ?? "").replace(/\/v1\/?$/, "");

/** File urls may come back host-relative. */
export const resolveFileUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (isAbsolute(url)) return url;
  return `${apiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
};

/** Stored keys (e.g. a profile's `coverImageKey`) are served from `/uploads/<key>`. */
export const storageKeyUrl = (key: string | null | undefined): string | null => {
  if (!key) return null;
  return isAbsolute(key) ? key : resolveFileUrl(`/uploads/${key}`);
};

export const filesApi = {
  upload: async (file: OutgoingFile, kind: UploadKind): Promise<StoredFile> => {
    const formData = new FormData();
    // React Native's FormData takes a {uri, name, type} descriptor for the bytes.
    formData.append("file", file as unknown as Blob);
    formData.append("kind", kind);
    const response = await apiFormData.post<unknown>("/files", formData);
    const stored = unwrap<StoredFile>(response.data);
    return { ...stored, url: resolveFileUrl(stored.url) };
  },

  /** Frees the quota of an upload that was never attached. Refused once a message references it. */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },

  getUsage: async (): Promise<StorageUsage> => {
    if (USE_MOCK_DATA) return { usedBytes: 12_400_000, capBytes: 104_857_600 };
    const response = await api.get<unknown>("/files/usage");
    const raw = unwrap<Partial<StorageUsage>>(response.data);
    return { usedBytes: raw?.usedBytes ?? 0, capBytes: raw?.capBytes ?? 0 };
  },
};
