/**
 * Mimecast message tracking and hold management resource
 */

import type { HttpClient } from '../http.js';
import type {
  MessageTrackingParams,
  TrackedMessage,
  MessageInfo,
} from '../types/messages.js';
import type { MimecastResponse } from '../types/common.js';
import { MimecastNotFoundError } from '../errors.js';

export class MessagesResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Search for messages using tracking API
   */
  async find(params?: MessageTrackingParams): Promise<TrackedMessage[]> {
    const response = await this.httpClient.request<MimecastResponse<TrackedMessage>>(
      '/api/message-finder/search',
      {
        method: 'POST',
        body: {
          meta: {
            pagination: {
              pageSize: params?.pageSize ?? 50,
              ...(params?.pageToken ? { pageToken: params.pageToken } : {}),
            },
          },
          data: [
            {
              ...(params?.value ? { value: params.value } : {}),
              ...(params?.from ? { from: params.from } : {}),
              ...(params?.to ? { to: params.to } : {}),
              ...(params?.senderAddress ? { senderAddress: params.senderAddress } : {}),
              ...(params?.recipientAddress ? { recipientAddress: params.recipientAddress } : {}),
              ...(params?.messageStatus ? { messageStatus: params.messageStatus } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    return data as TrackedMessage[];
  }

  /**
   * Get detailed message information by ID
   */
  async getInfo(id: string): Promise<MessageInfo> {
    const response = await this.httpClient.request<MimecastResponse<MessageInfo>>(
      '/api/message-finder/get-message-info',
      {
        method: 'POST',
        body: {
          data: [{ id }],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    const item = Array.isArray(data) ? data[0] : data;
    if (item == null) {
      throw new MimecastNotFoundError(`Mimecast returned no message info for ${id}`, response);
    }
    return item as MessageInfo;
  }

  /**
   * Place a message on hold
   */
  async hold(id: string, reason?: string): Promise<{ success: boolean; id: string }> {
    const response = await this.httpClient.request<MimecastResponse<{ id: string }>>(
      '/api/gateway/hold-message',
      {
        method: 'POST',
        body: {
          data: [
            {
              id,
              ...(reason ? { reason } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    const item = (Array.isArray(data) ? data[0] : data) as { id: string };
    return { success: true, id: item?.id ?? id };
  }

  /**
   * Release a held message
   */
  async release(id: string): Promise<{ success: boolean; id: string }> {
    const response = await this.httpClient.request<MimecastResponse<{ id: string }>>(
      '/api/gateway/release-message',
      {
        method: 'POST',
        body: {
          data: [{ id }],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    const item = (Array.isArray(data) ? data[0] : data) as { id: string };
    return { success: true, id: item?.id ?? id };
  }
}
