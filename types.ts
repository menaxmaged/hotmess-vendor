/**
 * Global API response envelope — shared by every Modules/<name>/api.ts
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  message_en?: string;
  message_ar?: string;
  data?: T;
  item?: T;
  items?: T[];
  result?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
