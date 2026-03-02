/**
 * OAuth 2.0 Client Credentials token management for Mimecast API
 */

import type { ResolvedConfig } from './config.js';
import { MimecastAuthenticationError } from './errors.js';

export interface TokenInfo {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/** Buffer before expiry to trigger refresh (2 minutes) */
const EXPIRY_BUFFER_MS = 2 * 60 * 1000;

/**
 * Manages OAuth 2.0 Client Credentials token lifecycle for Mimecast
 */
export class AuthManager {
  private readonly config: ResolvedConfig;
  private token: TokenInfo | null = null;
  private refreshPromise: Promise<TokenInfo> | null = null;

  constructor(config: ResolvedConfig) {
    this.config = config;
  }

  async getToken(): Promise<string> {
    if (this.token && !this.isTokenNearExpiry(this.token)) {
      return this.token.accessToken;
    }

    if (this.refreshPromise) {
      const token = await this.refreshPromise;
      return token.accessToken;
    }

    const token = await this.acquireToken();
    return token.accessToken;
  }

  async refreshToken(): Promise<string> {
    this.token = null;

    if (this.refreshPromise) {
      const token = await this.refreshPromise;
      return token.accessToken;
    }

    const token = await this.acquireToken();
    return token.accessToken;
  }

  invalidateToken(): void {
    this.token = null;
  }

  hasValidToken(): boolean {
    return this.token !== null && !this.isTokenNearExpiry(this.token);
  }

  private async acquireToken(): Promise<TokenInfo> {
    this.refreshPromise = this.doAcquireToken();
    try {
      const token = await this.refreshPromise;
      this.token = token;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doAcquireToken(): Promise<TokenInfo> {
    const tokenUrl = `${this.config.baseUrl}/oauth/token`;

    const bodyParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    let response: Response;
    try {
      response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
    } catch (error) {
      throw new MimecastAuthenticationError(
        `Failed to reach Mimecast token endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      );
    }

    if (!response.ok) {
      const rawText = await response.text();
      let errorBody: unknown;
      try {
        errorBody = JSON.parse(rawText);
      } catch {
        errorBody = rawText;
      }
      throw new MimecastAuthenticationError(
        `Failed to acquire token: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresAt,
    };
  }

  private isTokenNearExpiry(token: TokenInfo): boolean {
    return Date.now() >= token.expiresAt - EXPIRY_BUFFER_MS;
  }
}
