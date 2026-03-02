/**
 * Mimecast threat intelligence types
 */

export interface ThreatIncident {
  id: string;
  messageId?: string;
  status?: string;
  reason?: string;
  hash?: string;
  identifyingMimetype?: string;
  remediationType?: string;
  remediationStatus?: string;
  fileNames?: string[];
  affectedUser?: { emailAddress: string };
  created?: string;
  modified?: string;
}

export interface ThreatIncidentsParams {
  status?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface TtpUrlLog {
  userEmailAddress?: string;
  url?: string;
  action?: string;
  adminOverride?: string;
  userOverride?: string;
  category?: string;
  route?: string;
  creationMethod?: string;
  ttpDefinition?: string;
  fromUserEmailAddress?: string;
  date?: string;
  messageId?: string;
  subject?: string;
}

export interface TtpAttachmentLog {
  userEmailAddress?: string;
  filename?: string;
  fileType?: string;
  action?: string;
  route?: string;
  definition?: string;
  date?: string;
  messageId?: string;
  subject?: string;
  result?: string;
  sandboxResult?: string;
}

export interface TtpImpersonationLog {
  senderAddress?: string;
  recipientAddress?: string;
  subject?: string;
  action?: string;
  definition?: string;
  hits?: number;
  date?: string;
  messageId?: string;
  taggedExternal?: boolean;
  taggedMalicious?: boolean;
}

export type TtpType = 'url' | 'attachment' | 'impersonation';

export interface TtpLogsParams {
  type: TtpType;
  from?: string;
  to?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface AuditEvent {
  id?: string;
  user?: string;
  eventTime?: string;
  eventInfo?: string;
  category?: string;
  action?: string;
  source?: string;
}

export interface AuditEventsParams {
  from?: string;
  to?: string;
  categories?: string[];
  pageSize?: number;
  pageToken?: string;
}
