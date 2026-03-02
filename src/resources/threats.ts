/**
 * Mimecast threat intelligence resource
 */

import type { HttpClient } from '../http.js';
import type {
  ThreatIncident,
  ThreatIncidentsParams,
  TtpUrlLog,
  TtpAttachmentLog,
  TtpImpersonationLog,
  TtpLogsParams,
  AuditEvent,
  AuditEventsParams,
} from '../types/threats.js';
import type { MimecastResponse } from '../types/common.js';

export class ThreatsResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get threat remediation incidents
   */
  async getIncidents(params?: ThreatIncidentsParams): Promise<ThreatIncident[]> {
    const response = await this.httpClient.request<MimecastResponse<ThreatIncident>>(
      '/api/ttp/remediation/get-incidents',
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
              ...(params?.status ? { status: params.status } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    return data as ThreatIncident[];
  }

  /**
   * Get TTP URL protection logs
   */
  async getUrlLogs(params: TtpLogsParams): Promise<TtpUrlLog[]> {
    const response = await this.httpClient.request<MimecastResponse<TtpUrlLog>>(
      '/api/ttp/url/get-logs',
      {
        method: 'POST',
        body: {
          meta: {
            pagination: {
              pageSize: params.pageSize ?? 50,
              ...(params.pageToken ? { pageToken: params.pageToken } : {}),
            },
          },
          data: [
            {
              ...(params.from ? { from: params.from } : {}),
              ...(params.to ? { to: params.to } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    return (Array.isArray(data) ? data[0] : data) as unknown as TtpUrlLog[];
  }

  /**
   * Get TTP attachment protection logs
   */
  async getAttachmentLogs(params: TtpLogsParams): Promise<TtpAttachmentLog[]> {
    const response = await this.httpClient.request<MimecastResponse<TtpAttachmentLog>>(
      '/api/ttp/attachment/get-logs',
      {
        method: 'POST',
        body: {
          meta: {
            pagination: {
              pageSize: params.pageSize ?? 50,
              ...(params.pageToken ? { pageToken: params.pageToken } : {}),
            },
          },
          data: [
            {
              ...(params.from ? { from: params.from } : {}),
              ...(params.to ? { to: params.to } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    return (Array.isArray(data) ? data[0] : data) as unknown as TtpAttachmentLog[];
  }

  /**
   * Get TTP impersonation protection logs
   */
  async getImpersonationLogs(params: TtpLogsParams): Promise<TtpImpersonationLog[]> {
    const response = await this.httpClient.request<MimecastResponse<TtpImpersonationLog>>(
      '/api/ttp/impersonation/get-logs',
      {
        method: 'POST',
        body: {
          meta: {
            pagination: {
              pageSize: params.pageSize ?? 50,
              ...(params.pageToken ? { pageToken: params.pageToken } : {}),
            },
          },
          data: [
            {
              ...(params.from ? { from: params.from } : {}),
              ...(params.to ? { to: params.to } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    return (Array.isArray(data) ? data[0] : data) as unknown as TtpImpersonationLog[];
  }

  /**
   * Get audit log events
   */
  async getAuditEvents(params?: AuditEventsParams): Promise<AuditEvent[]> {
    const response = await this.httpClient.request<MimecastResponse<AuditEvent>>(
      '/api/audit/get-audit-events',
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
              ...(params?.from ? { startDateTime: params.from } : {}),
              ...(params?.to ? { endDateTime: params.to } : {}),
              ...(params?.categories ? { categories: params.categories } : {}),
            },
          ],
        },
      }
    );

    const data = Array.isArray(response) ? response : (response?.data ?? []);
    return data as AuditEvent[];
  }
}
