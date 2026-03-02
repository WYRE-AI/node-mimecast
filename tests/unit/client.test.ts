import { describe, it, expect } from 'vitest';
import { MimecastClient } from '../../src/client.js';

describe('MimecastClient', () => {
  it('creates a client with default region', () => {
    const client = new MimecastClient({
      clientId: 'test-id',
      clientSecret: 'test-secret',
    });
    const config = client.getConfig();
    expect(config.region).toBe('us');
    expect(config.baseUrl).toBe('https://api.services.mimecast.com');
  });

  it('creates a client with eu region', () => {
    const client = new MimecastClient({
      clientId: 'test-id',
      clientSecret: 'test-secret',
      region: 'eu',
    });
    expect(client.getConfig().baseUrl).toBe('https://eu-api.mimecast.com');
  });

  it('exposes messages, threats, and queue resources', () => {
    const client = new MimecastClient({
      clientId: 'test-id',
      clientSecret: 'test-secret',
    });
    expect(client.messages).toBeDefined();
    expect(client.threats).toBeDefined();
    expect(client.queue).toBeDefined();
  });
});
