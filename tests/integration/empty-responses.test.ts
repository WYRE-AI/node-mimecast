import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MimecastClient } from '../../src/client.js';
import { MimecastError, MimecastNotFoundError } from '../../src/errors.js';
import { server } from '../mocks/server.js';

const BASE_URL = 'https://api.services.mimecast.com';

const emptyEnvelope = {
  meta: { status: 200 },
  data: [],
  fail: [],
};

describe('empty entity responses', () => {
  const client = new MimecastClient({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  });

  it('messages.getInfo throws a descriptive error when Mimecast returns no data', async () => {
    server.use(
      http.post(`${BASE_URL}/api/message-finder/get-message-info`, () =>
        HttpResponse.json(emptyEnvelope)
      )
    );

    const promise = client.messages.getInfo('msg-404');
    await expect(promise).rejects.toBeInstanceOf(MimecastNotFoundError);
    await expect(promise).rejects.toThrow('Mimecast returned no message info for msg-404');
  });

  it('queue.getStatus throws a descriptive error when Mimecast returns no data', async () => {
    server.use(
      http.post(`${BASE_URL}/api/gateway/get-queue-stats`, () =>
        HttpResponse.json(emptyEnvelope)
      )
    );

    const promise = client.queue.getStatus();
    await expect(promise).rejects.toBeInstanceOf(MimecastError);
    await expect(promise).rejects.toThrow('Mimecast returned no queue status data');
  });

  it('threats.getUrlLogs returns an empty array when Mimecast returns no data', async () => {
    server.use(
      http.post(`${BASE_URL}/api/ttp/url/get-logs`, () => HttpResponse.json(emptyEnvelope))
    );

    const logs = await client.threats.getUrlLogs({ type: 'url' });
    expect(logs).toEqual([]);
  });

  it('threats.getAttachmentLogs returns an empty array when Mimecast returns no data', async () => {
    server.use(
      http.post(`${BASE_URL}/api/ttp/attachment/get-logs`, () =>
        HttpResponse.json(emptyEnvelope)
      )
    );

    const logs = await client.threats.getAttachmentLogs({ type: 'attachment' });
    expect(logs).toEqual([]);
  });

  it('threats.getImpersonationLogs returns an empty array when Mimecast returns no data', async () => {
    server.use(
      http.post(`${BASE_URL}/api/ttp/impersonation/get-logs`, () =>
        HttpResponse.json(emptyEnvelope)
      )
    );

    const logs = await client.threats.getImpersonationLogs({ type: 'impersonation' });
    expect(logs).toEqual([]);
  });

  it('threats.getUrlLogs still unwraps the nested log array for the fixture shape', async () => {
    const logs = await client.threats.getUrlLogs({ type: 'url' });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toHaveProperty('url');
  });
});
