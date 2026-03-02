/**
 * HTTP layer for the Mimecast API
 */

import type { ResolvedConfig } from './config.js';
import type { AuthManager } from './auth.js';
import type { RateLimiter } from './rate-limiter.js';
import {
  MimecastError,
  MimecastAuthenticationError,
  MimecastForbiddenError,
  MimecastNotFoundError,
  MimecastValidationError,
  MimecastRateLimitError,
  MimecastServerError,
} from './errors.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

export class HttpClient {
  private readonly config: ResolvedConfig;
  private readonly authManager: AuthManager;
  private readonly rateLimiter: RateLimiter;

  constructor(config: ResolvedConfig, authManager: AuthManager, rateLimiter: RateLimiter) {
    this.config = config;
    this.authManager = authManager;
    this.rateLimiter = rateLimiter;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params, skipAuth = false } = options;

    let url = `${this.config.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.executeRequest<T>(url, method, body, skipAuth);
  }

  private async executeRequest<T>(
    url: string,
    method: string,
    body: unknown,
    skipAuth: boolean,
    retryCount: number = 0,
    isRetryAfter401: boolean = false
  ): Promise<T> {
    await this.rateLimiter.waitForSlot();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = await this.authManager.getToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.rateLimiter.recordRequest();

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(
      response,
      url,
      method,
      body,
      skipAuth,
      retryCount,
      isRetryAfter401
    );
  }

  private async handleResponse<T>(
    response: Response,
    url: string,
    method: string,
    body: unknown,
    skipAuth: boolean,
    retryCount: number,
    isRetryAfter401: boolean
  ): Promise<T> {
    if (response.ok) {
      if (response.status === 204) return {} as T;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>;
      }
      return {} as T;
    }

    // SAFE: read body as text once, then attempt JSON.parse
    const rawText = await response.text();
    let responseBody: unknown;
    try {
      responseBody = JSON.parse(rawText);
    } catch {
      responseBody = rawText;
    }

    switch (response.status) {
      case 400:
        throw new MimecastValidationError(
          'Bad request — invalid parameters',
          this.parseValidationErrors(responseBody),
          responseBody
        );

      case 401:
        if (isRetryAfter401) {
          throw new MimecastAuthenticationError(
            'Authentication failed after token refresh',
            401,
            responseBody
          );
        }
        await this.authManager.refreshToken();
        return this.executeRequest<T>(url, method, body, skipAuth, retryCount, true);

      case 403:
        throw new MimecastForbiddenError(
          'Access forbidden — insufficient permissions',
          responseBody
        );

      case 404:
        throw new MimecastNotFoundError('Resource not found', responseBody);

      case 429: {
        if (this.rateLimiter.shouldRetry(retryCount)) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const delay = this.rateLimiter.parseRetryAfter(retryAfterHeader);
          await this.sleep(delay);
          return this.executeRequest<T>(url, method, body, skipAuth, retryCount + 1, isRetryAfter401);
        }
        throw new MimecastRateLimitError(
          'Rate limit exceeded and max retries reached',
          5000,
          responseBody
        );
      }

      default:
        if (response.status >= 500) {
          if (retryCount === 0) {
            await this.sleep(1000);
            return this.executeRequest<T>(url, method, body, skipAuth, 1, isRetryAfter401);
          }
          throw new MimecastServerError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status,
            responseBody
          );
        }
        throw new MimecastError(
          `Request failed: ${response.status} ${response.statusText}`,
          response.status,
          responseBody
        );
    }
  }

  private parseValidationErrors(
    responseBody: unknown
  ): Array<{ field: string; message: string }> {
    if (typeof responseBody === 'object' && responseBody !== null) {
      const body = responseBody as Record<string, unknown>;
      const errors = body['errors'] ?? body['fail'];
      if (Array.isArray(errors)) {
        return errors.map((err: unknown) => {
          if (typeof err === 'object' && err !== null) {
            const e = err as Record<string, unknown>;
            return {
              field: String(e['field'] ?? e['key'] ?? 'unknown'),
              message: String(e['message'] ?? e['msg'] ?? 'Unknown error'),
            };
          }
          return { field: 'unknown', message: String(err) };
        });
      }
    }
    return [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
