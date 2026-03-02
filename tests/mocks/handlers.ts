import { http, HttpResponse } from 'msw';
import * as fixtures from '../fixtures/index.js';

const BASE_URL = 'https://api.services.mimecast.com';

export const handlers = [
  // Token endpoint
  http.post(`${BASE_URL}/oauth/token`, async ({ request }) => {
    const body = await request.text();
    if (body.includes('bad-client-id')) {
      return HttpResponse.json(fixtures.auth.tokenFailure, { status: 400 });
    }
    return HttpResponse.json(fixtures.auth.tokenSuccess);
  }),

  // Message search
  http.post(`${BASE_URL}/api/message-finder/search`, () =>
    HttpResponse.json(fixtures.messages.searchResults)
  ),

  // Message info
  http.post(`${BASE_URL}/api/message-finder/get-message-info`, () =>
    HttpResponse.json(fixtures.messages.messageInfo)
  ),

  // Hold message
  http.post(`${BASE_URL}/api/gateway/hold-message`, () =>
    HttpResponse.json(fixtures.messages.holdResult)
  ),

  // Release message
  http.post(`${BASE_URL}/api/gateway/release-message`, () =>
    HttpResponse.json(fixtures.messages.releaseResult)
  ),

  // Threat incidents
  http.post(`${BASE_URL}/api/ttp/remediation/get-incidents`, () =>
    HttpResponse.json(fixtures.threats.incidents)
  ),

  // TTP URL logs
  http.post(`${BASE_URL}/api/ttp/url/get-logs`, () =>
    HttpResponse.json(fixtures.threats.urlLogs)
  ),

  // TTP attachment logs
  http.post(`${BASE_URL}/api/ttp/attachment/get-logs`, () =>
    HttpResponse.json(fixtures.threats.urlLogs)
  ),

  // TTP impersonation logs
  http.post(`${BASE_URL}/api/ttp/impersonation/get-logs`, () =>
    HttpResponse.json(fixtures.threats.urlLogs)
  ),

  // Audit events
  http.post(`${BASE_URL}/api/audit/get-audit-events`, () =>
    HttpResponse.json(fixtures.threats.auditEvents)
  ),

  // Queue status
  http.post(`${BASE_URL}/api/gateway/get-queue-stats`, () =>
    HttpResponse.json(fixtures.queue.status)
  ),
];
