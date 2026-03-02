/**
 * Mimecast email queue types
 */

export interface QueueStatus {
  inbound?: QueueDirection;
  outbound?: QueueDirection;
}

export interface QueueDirection {
  count?: number;
  oldest?: string;
  details?: QueueEntry[];
}

export interface QueueEntry {
  id?: string;
  created?: string;
  status?: string;
  from?: string;
  to?: string[];
  subject?: string;
  reason?: string;
}
