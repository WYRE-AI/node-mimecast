/**
 * Main Mimecast API Client
 */

import type { MimecastConfig, ResolvedConfig } from './config.js';
import { resolveConfig } from './config.js';
import { AuthManager } from './auth.js';
import { HttpClient } from './http.js';
import { RateLimiter } from './rate-limiter.js';
import { MessagesResource } from './resources/messages.js';
import { ThreatsResource } from './resources/threats.js';
import { QueueResource } from './resources/queue.js';

/**
 * Mimecast Email Security API Client
 *
 * @example
 * ```typescript
 * const client = new MimecastClient({
 *   clientId: process.env.MIMECAST_CLIENT_ID!,
 *   clientSecret: process.env.MIMECAST_CLIENT_SECRET!,
 *   region: 'us',
 * });
 *
 * // Find messages
 * const messages = await client.messages.find({ senderAddress: 'attacker@evil.com' });
 *
 * // Get TTP URL logs
 * const urlLogs = await client.threats.getUrlLogs({ type: 'url' });
 *
 * // Check queue status
 * const queue = await client.queue.getStatus();
 * ```
 */
export class MimecastClient {
  private readonly config: ResolvedConfig;
  private readonly authManager: AuthManager;
  private readonly rateLimiter: RateLimiter;
  private readonly httpClient: HttpClient;

  /** Message tracking and hold management */
  readonly messages: MessagesResource;
  /** Threat intelligence (TTP, remediation, audit) */
  readonly threats: ThreatsResource;
  /** Email delivery queue */
  readonly queue: QueueResource;

  constructor(config: MimecastConfig) {
    this.config = resolveConfig(config);
    this.authManager = new AuthManager(this.config);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.httpClient = new HttpClient(this.config, this.authManager, this.rateLimiter);

    this.messages = new MessagesResource(this.httpClient);
    this.threats = new ThreatsResource(this.httpClient);
    this.queue = new QueueResource(this.httpClient);
  }

  getConfig(): Readonly<ResolvedConfig> {
    return this.config;
  }

  invalidateToken(): void {
    this.authManager.invalidateToken();
  }

  getRateLimitStatus(): { remaining: number; rate: number } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      rate: this.rateLimiter.getCurrentRate(),
    };
  }
}
