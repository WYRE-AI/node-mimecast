/**
 * Test fixtures for node-mimecast
 */

export const auth = {
  tokenSuccess: {
    access_token: 'test-bearer-token',
    token_type: 'Bearer',
    expires_in: 3600,
  },
  tokenFailure: {
    error: 'invalid_client',
    error_description: 'Invalid client credentials',
  },
};

export const messages = {
  searchResults: {
    meta: { status: 200, pagination: { pageSize: 50 } },
    data: [
      {
        id: 'msg-001',
        status: 'delivered',
        fromEnv: { emailAddress: 'sender@example.com' },
        to: [{ emailAddress: 'recipient@example.com' }],
        subject: 'Test email',
        received: '2026-03-01T10:00:00Z',
      },
    ],
    fail: [],
  },
  messageInfo: {
    meta: { status: 200 },
    data: [
      {
        id: 'msg-001',
        status: 'delivered',
        fromEnv: { emailAddress: 'sender@example.com' },
        to: [{ emailAddress: 'recipient@example.com' }],
        subject: 'Test email',
        received: '2026-03-01T10:00:00Z',
        headers: { 'Message-ID': '<test-id@example.com>' },
      },
    ],
    fail: [],
  },
  holdResult: {
    meta: { status: 200 },
    data: [{ id: 'msg-001' }],
    fail: [],
  },
  releaseResult: {
    meta: { status: 200 },
    data: [{ id: 'msg-001' }],
    fail: [],
  },
};

export const threats = {
  incidents: {
    meta: { status: 200, pagination: { pageSize: 50 } },
    data: [
      {
        id: 'incident-001',
        messageId: 'msg-001',
        status: 'open',
        reason: 'Malicious attachment',
        remediationType: 'delete',
        remediationStatus: 'pending',
      },
    ],
    fail: [],
  },
  urlLogs: {
    meta: { status: 200, pagination: { pageSize: 50 } },
    data: [
      [
        {
          userEmailAddress: 'user@example.com',
          url: 'https://malicious.example.com',
          action: 'block',
          date: '2026-03-01T10:00:00Z',
        },
      ],
    ],
    fail: [],
  },
  auditEvents: {
    meta: { status: 200, pagination: { pageSize: 50 } },
    data: [
      {
        id: 'audit-001',
        user: 'admin@example.com',
        eventTime: '2026-03-01T10:00:00Z',
        eventInfo: 'Policy updated',
        category: 'administration',
        action: 'update',
      },
    ],
    fail: [],
  },
};

export const queue = {
  status: {
    meta: { status: 200 },
    data: [
      {
        inbound: { count: 5, oldest: '2026-03-01T09:30:00Z' },
        outbound: { count: 2, oldest: '2026-03-01T09:45:00Z' },
      },
    ],
    fail: [],
  },
};
