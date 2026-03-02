/**
 * Mimecast email delivery queue resource
 */

import type { HttpClient } from '../http.js';
import type { QueueStatus } from '../types/queue.js';
import type { MimecastResponse } from '../types/common.js';

export class QueueResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get email delivery queue status
   */
  async getStatus(): Promise<QueueStatus> {
    const response = await this.httpClient.request<MimecastResponse<QueueStatus>>(
      '/api/gateway/get-queue-stats',
      {
        method: 'POST',
        body: {
          data: [{}],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    const item = (Array.isArray(data) ? data[0] : data) as QueueStatus;
    return item ?? {};
  }
}
