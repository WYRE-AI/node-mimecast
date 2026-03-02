/**
 * Rate limiter for Mimecast API requests
 */

import type { RateLimitConfig } from './config.js';

export class RateLimiter {
  private readonly config: RateLimitConfig;
  private requestTimestamps: number[] = [];

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitForSlot(): Promise<void> {
    if (!this.config.enabled) return;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > windowStart);

    const requestCount = this.requestTimestamps.length;
    const throttleAt = Math.floor(this.config.maxRequests * this.config.throttleThreshold);

    if (requestCount >= this.config.maxRequests) {
      // At limit — wait until oldest request falls out of window
      const oldestInWindow = this.requestTimestamps[0];
      if (oldestInWindow) {
        const waitMs = oldestInWindow + this.config.windowMs - now + 10;
        if (waitMs > 0) {
          await this.sleep(waitMs);
        }
      }
    } else if (requestCount >= throttleAt) {
      // Approaching limit — add small delay
      await this.sleep(200);
    }
  }

  recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  shouldRetry(retryCount: number): boolean {
    return retryCount < this.config.maxRetries;
  }

  parseRetryAfter(retryAfterHeader: string | null): number {
    if (!retryAfterHeader) return this.config.retryAfterMs;
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) return seconds * 1000;
    return this.config.retryAfterMs;
  }

  handleRateLimitError(retryCount: number): void {
    // Exponential backoff: 5s, 10s, 20s
    const delay = this.config.retryAfterMs * Math.pow(2, retryCount);
    return void delay;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const active = this.requestTimestamps.filter(ts => ts > windowStart).length;
    return Math.max(0, this.config.maxRequests - active);
  }

  getCurrentRate(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    return this.requestTimestamps.filter(ts => ts > windowStart).length;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
