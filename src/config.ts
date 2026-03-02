/**
 * Configuration types and defaults for the Mimecast client
 */

/**
 * Mimecast regional API base URLs
 * See: https://developer.services.mimecast.com/api-overview/global-base-urls
 */
export type MimecastRegion =
  | 'us'
  | 'eu'
  | 'de'
  | 'ca'
  | 'za'
  | 'au'
  | 'offshore'
  | 'je';

export const REGION_URLS: Record<MimecastRegion, string> = {
  us: 'https://api.services.mimecast.com',
  eu: 'https://eu-api.mimecast.com',
  de: 'https://de-api.mimecast.com',
  ca: 'https://ca-api.mimecast.com',
  za: 'https://za-api.mimecast.com',
  au: 'https://au-api.mimecast.com',
  offshore: 'https://offshore-api.mimecast.com',
  je: 'https://je-api.mimecast.com',
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  throttleThreshold: number;
  retryAfterMs: number;
  maxRetries: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  maxRequests: 100,
  windowMs: 60_000,
  throttleThreshold: 0.8,
  retryAfterMs: 5_000,
  maxRetries: 3,
};

/**
 * Configuration for the Mimecast client
 */
export interface MimecastConfig {
  /** OAuth 2.0 Client ID */
  clientId: string;
  /** OAuth 2.0 Client Secret */
  clientSecret: string;
  /** Mimecast region (default: 'us') */
  region?: MimecastRegion;
  /** Explicit base URL (alternative to region) */
  baseUrl?: string;
  /** Rate limiting configuration */
  rateLimit?: Partial<RateLimitConfig>;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  region: MimecastRegion;
  rateLimit: RateLimitConfig;
}

/**
 * Resolves a configuration object by applying defaults
 */
export function resolveConfig(config: MimecastConfig): ResolvedConfig {
  let baseUrl: string;
  let region: MimecastRegion;

  if (config.baseUrl) {
    baseUrl = config.baseUrl.replace(/\/$/, '');
    region = config.region ?? 'us';
  } else {
    region = config.region ?? 'us';
    const regionUrl = REGION_URLS[region];
    if (!regionUrl) {
      throw new Error(
        `Invalid region: ${region}. Valid regions are: ${Object.keys(REGION_URLS).join(', ')}`
      );
    }
    baseUrl = regionUrl;
  }

  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    baseUrl,
    region,
    rateLimit: {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config.rateLimit,
    },
  };
}
