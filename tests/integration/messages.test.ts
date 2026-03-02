import { describe, it, expect } from 'vitest';
import { MimecastClient } from '../../src/client.js';

describe('MessagesResource (integration)', () => {
  const client = new MimecastClient({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  });

  it('finds messages', async () => {
    const messages = await client.messages.find({ pageSize: 10 });
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toHaveProperty('id');
    expect(messages[0]).toHaveProperty('status');
  });

  it('gets message info', async () => {
    const info = await client.messages.getInfo('msg-001');
    expect(info).toHaveProperty('id');
    expect(info).toHaveProperty('status');
  });

  it('holds a message', async () => {
    const result = await client.messages.hold('msg-001', 'Suspicious content');
    expect(result.success).toBe(true);
    expect(result.id).toBe('msg-001');
  });

  it('releases a message', async () => {
    const result = await client.messages.release('msg-001');
    expect(result.success).toBe(true);
    expect(result.id).toBe('msg-001');
  });
});

describe('ThreatsResource (integration)', () => {
  const client = new MimecastClient({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  });

  it('gets threat incidents', async () => {
    const incidents = await client.threats.getIncidents();
    expect(Array.isArray(incidents)).toBe(true);
  });

  it('gets audit events', async () => {
    const events = await client.threats.getAuditEvents();
    expect(Array.isArray(events)).toBe(true);
  });
});

describe('QueueResource (integration)', () => {
  const client = new MimecastClient({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  });

  it('gets queue status', async () => {
    const status = await client.queue.getStatus();
    expect(status).toBeDefined();
  });
});
