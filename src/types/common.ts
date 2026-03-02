/**
 * Common types shared across Mimecast API resources
 */

export interface MimecastMeta {
  status: number;
  pagination?: {
    pageSize: number;
    next?: string;
    previous?: string;
  };
}

export interface MimecastResponse<T> {
  meta: MimecastMeta;
  data: T[];
  fail?: Array<{ errors: Array<{ code: string; message: string; retryable: boolean }> }>;
}

export interface PaginationParams {
  pageSize?: number;
  pageToken?: string;
}
