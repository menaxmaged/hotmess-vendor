/**
 * Files Feature Types — POST /v1/files and friends.
 */

/**
 * `chat_attachment` is the only kind the nightly sweep reclaims (unsent
 * uploads). `vendor_portfolio` is the studio-media kind documented by the
 * profile files flow; it is not swept.
 */
export type UploadKind = "chat_attachment" | "vendor_portfolio";

export interface OutgoingFile {
  uri: string;
  name: string;
  type: string;
}

export interface StoredFile {
  id: string;
  /** A key, not a URL — bytes are served from `/uploads/<storageKey>`. */
  storageKey: string;
  originalName: string | null;
  mimeType: string;
  byteSize: number;
  kind: UploadKind;
  /** Resolved to an absolute URL. */
  url: string;
}

/** Both in bytes. `capBytes` comes from platform settings — never hardcode it. */
export interface StorageUsage {
  usedBytes: number;
  capBytes: number;
}
