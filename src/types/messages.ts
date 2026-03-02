/**
 * Mimecast message tracking types
 */

export interface MessageTrackingParams {
  /** Search keyword */
  value?: string;
  /** Start date-time (ISO 8601) */
  from?: string;
  /** End date-time (ISO 8601) */
  to?: string;
  /** Sender email address */
  senderAddress?: string;
  /** Recipient email address */
  recipientAddress?: string;
  /** Message status */
  messageStatus?: 'accepted' | 'blocked' | 'bounced' | 'deferred' | 'delivered' | 'failed' | 'held' | 'processing' | 'queued';
  /** Page size (max 100) */
  pageSize?: number;
  /** Pagination token */
  pageToken?: string;
}

export interface TrackedMessage {
  id: string;
  status: string;
  fromEnv?: { emailAddress: string; displayableName?: string };
  to?: Array<{ emailAddress: string; displayableName?: string }>;
  subject?: string;
  received?: string;
  size?: number;
  attachments?: boolean;
  processed?: string;
  route?: string;
  senderIp?: string;
  spamScore?: number;
}

export interface MessageInfo {
  id: string;
  status: string;
  fromEnv?: { emailAddress: string; displayableName?: string };
  to?: Array<{ emailAddress: string; displayableName?: string }>;
  subject?: string;
  received?: string;
  size?: number;
  attachments?: boolean;
  processed?: string;
  route?: string;
  senderIp?: string;
  spamScore?: number;
  headers?: Record<string, string>;
  rejectionInfo?: { rejectionType?: string; rejectionCode?: string; rejectionMessage?: string };
}
