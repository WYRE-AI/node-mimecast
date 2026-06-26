/**
 * Configuration types and defaults for the Mimecast client
 */
/**
 * Mimecast regional API base URLs
 * See: https://developer.services.mimecast.com/api-overview/global-base-urls
 */
type MimecastRegion = 'us' | 'eu' | 'de' | 'ca' | 'za' | 'au' | 'offshore' | 'je';
/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
    throttleThreshold: number;
    retryAfterMs: number;
    maxRetries: number;
}
/**
 * Configuration for the Mimecast client
 */
interface MimecastConfig {
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
interface ResolvedConfig {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    region: MimecastRegion;
    rateLimit: RateLimitConfig;
}
/**
 * Resolves a configuration object by applying defaults
 */
declare function resolveConfig(config: MimecastConfig): ResolvedConfig;

/**
 * OAuth 2.0 Client Credentials token management for Mimecast API
 */

interface TokenInfo {
    accessToken: string;
    tokenType: string;
    expiresAt: number;
}
/**
 * Manages OAuth 2.0 Client Credentials token lifecycle for Mimecast
 */
declare class AuthManager {
    private readonly config;
    private token;
    private refreshPromise;
    constructor(config: ResolvedConfig);
    getToken(): Promise<string>;
    refreshToken(): Promise<string>;
    invalidateToken(): void;
    hasValidToken(): boolean;
    private acquireToken;
    private doAcquireToken;
    private isTokenNearExpiry;
}

/**
 * Rate limiter for Mimecast API requests
 */

declare class RateLimiter {
    private readonly config;
    private requestTimestamps;
    constructor(config: RateLimitConfig);
    waitForSlot(): Promise<void>;
    recordRequest(): void;
    shouldRetry(retryCount: number): boolean;
    parseRetryAfter(retryAfterHeader: string | null): number;
    handleRateLimitError(retryCount: number): void;
    getRemainingRequests(): number;
    getCurrentRate(): number;
    private sleep;
}

/**
 * HTTP layer for the Mimecast API
 */

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    skipAuth?: boolean;
}
declare class HttpClient {
    private readonly config;
    private readonly authManager;
    private readonly rateLimiter;
    constructor(config: ResolvedConfig, authManager: AuthManager, rateLimiter: RateLimiter);
    request<T>(path: string, options?: RequestOptions): Promise<T>;
    private executeRequest;
    private handleResponse;
    private parseValidationErrors;
    private sleep;
}

/**
 * Mimecast message tracking types
 */
interface MessageTrackingParams {
    /** Search keyword */
    value?: string;
    /** Start date-time (ISO 8601) */
    from?: string;
    /** End date-time (ISO 8601) */
    to?: string;
    /** Sender email address */
    senderAddress?: string;
    /** Recipient email address */
    recipientAddress?: string;
    /** Message status */
    messageStatus?: 'accepted' | 'blocked' | 'bounced' | 'deferred' | 'delivered' | 'failed' | 'held' | 'processing' | 'queued';
    /** Page size (max 100) */
    pageSize?: number;
    /** Pagination token */
    pageToken?: string;
}
interface TrackedMessage {
    id: string;
    status: string;
    fromEnv?: {
        emailAddress: string;
        displayableName?: string;
    };
    to?: Array<{
        emailAddress: string;
        displayableName?: string;
    }>;
    subject?: string;
    received?: string;
    size?: number;
    attachments?: boolean;
    processed?: string;
    route?: string;
    senderIp?: string;
    spamScore?: number;
}
interface MessageInfo {
    id: string;
    status: string;
    fromEnv?: {
        emailAddress: string;
        displayableName?: string;
    };
    to?: Array<{
        emailAddress: string;
        displayableName?: string;
    }>;
    subject?: string;
    received?: string;
    size?: number;
    attachments?: boolean;
    processed?: string;
    route?: string;
    senderIp?: string;
    spamScore?: number;
    headers?: Record<string, string>;
    rejectionInfo?: {
        rejectionType?: string;
        rejectionCode?: string;
        rejectionMessage?: string;
    };
}

/**
 * Mimecast message tracking and hold management resource
 */

declare class MessagesResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Search for messages using tracking API
     */
    find(params?: MessageTrackingParams): Promise<TrackedMessage[]>;
    /**
     * Get detailed message information by ID
     */
    getInfo(id: string): Promise<MessageInfo>;
    /**
     * Place a message on hold
     */
    hold(id: string, reason?: string): Promise<{
        success: boolean;
        id: string;
    }>;
    /**
     * Release a held message
     */
    release(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
}

/**
 * Mimecast threat intelligence types
 */
interface ThreatIncident {
    id: string;
    messageId?: string;
    status?: string;
    reason?: string;
    hash?: string;
    identifyingMimetype?: string;
    remediationType?: string;
    remediationStatus?: string;
    fileNames?: string[];
    affectedUser?: {
        emailAddress: string;
    };
    created?: string;
    modified?: string;
}
interface ThreatIncidentsParams {
    status?: string;
    pageSize?: number;
    pageToken?: string;
}
interface TtpUrlLog {
    userEmailAddress?: string;
    url?: string;
    action?: string;
    adminOverride?: string;
    userOverride?: string;
    category?: string;
    route?: string;
    creationMethod?: string;
    ttpDefinition?: string;
    fromUserEmailAddress?: string;
    date?: string;
    messageId?: string;
    subject?: string;
}
interface TtpAttachmentLog {
    userEmailAddress?: string;
    filename?: string;
    fileType?: string;
    action?: string;
    route?: string;
    definition?: string;
    date?: string;
    messageId?: string;
    subject?: string;
    result?: string;
    sandboxResult?: string;
}
interface TtpImpersonationLog {
    senderAddress?: string;
    recipientAddress?: string;
    subject?: string;
    action?: string;
    definition?: string;
    hits?: number;
    date?: string;
    messageId?: string;
    taggedExternal?: boolean;
    taggedMalicious?: boolean;
}
type TtpType = 'url' | 'attachment' | 'impersonation';
interface TtpLogsParams {
    type: TtpType;
    from?: string;
    to?: string;
    pageSize?: number;
    pageToken?: string;
}
interface AuditEvent {
    id?: string;
    user?: string;
    eventTime?: string;
    eventInfo?: string;
    category?: string;
    action?: string;
    source?: string;
}
interface AuditEventsParams {
    from?: string;
    to?: string;
    categories?: string[];
    pageSize?: number;
    pageToken?: string;
}

/**
 * Mimecast threat intelligence resource
 */

declare class ThreatsResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Get threat remediation incidents
     */
    getIncidents(params?: ThreatIncidentsParams): Promise<ThreatIncident[]>;
    /**
     * Get TTP URL protection logs
     */
    getUrlLogs(params: TtpLogsParams): Promise<TtpUrlLog[]>;
    /**
     * Get TTP attachment protection logs
     */
    getAttachmentLogs(params: TtpLogsParams): Promise<TtpAttachmentLog[]>;
    /**
     * Get TTP impersonation protection logs
     */
    getImpersonationLogs(params: TtpLogsParams): Promise<TtpImpersonationLog[]>;
    /**
     * Get audit log events
     */
    getAuditEvents(params?: AuditEventsParams): Promise<AuditEvent[]>;
}

/**
 * Mimecast email queue types
 */
interface QueueStatus {
    inbound?: QueueDirection;
    outbound?: QueueDirection;
}
interface QueueDirection {
    count?: number;
    oldest?: string;
    details?: QueueEntry[];
}
interface QueueEntry {
    id?: string;
    created?: string;
    status?: string;
    from?: string;
    to?: string[];
    subject?: string;
    reason?: string;
}

/**
 * Mimecast email delivery queue resource
 */

declare class QueueResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Get email delivery queue status
     */
    getStatus(): Promise<QueueStatus>;
}

/**
 * Main Mimecast API Client
 */

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
declare class MimecastClient {
    private readonly config;
    private readonly authManager;
    private readonly rateLimiter;
    private readonly httpClient;
    /** Message tracking and hold management */
    readonly messages: MessagesResource;
    /** Threat intelligence (TTP, remediation, audit) */
    readonly threats: ThreatsResource;
    /** Email delivery queue */
    readonly queue: QueueResource;
    constructor(config: MimecastConfig);
    getConfig(): Readonly<ResolvedConfig>;
    invalidateToken(): void;
    getRateLimitStatus(): {
        remaining: number;
        rate: number;
    };
}

/**
 * Custom error classes for the Mimecast client
 */
/**
 * Base error class for all Mimecast errors
 */
declare class MimecastError extends Error {
    readonly statusCode: number;
    readonly response: unknown;
    constructor(message: string, statusCode?: number, response?: unknown);
}
/**
 * Authentication error (401 unauthorized, invalid credentials)
 */
declare class MimecastAuthenticationError extends MimecastError {
    constructor(message: string, statusCode?: number, response?: unknown);
}
/**
 * Forbidden error (403 permission denied)
 */
declare class MimecastForbiddenError extends MimecastError {
    constructor(message: string, response?: unknown);
}
/**
 * Resource not found error (404)
 */
declare class MimecastNotFoundError extends MimecastError {
    constructor(message: string, response?: unknown);
}
/**
 * Validation error (400 with field-level errors)
 */
declare class MimecastValidationError extends MimecastError {
    readonly errors: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, errors?: Array<{
        field: string;
        message: string;
    }>, response?: unknown);
}
/**
 * Rate limit exceeded error (429)
 */
declare class MimecastRateLimitError extends MimecastError {
    readonly retryAfter: number;
    constructor(message: string, retryAfter?: number, response?: unknown);
}
/**
 * Server error (500+)
 */
declare class MimecastServerError extends MimecastError {
    constructor(message: string, statusCode?: number, response?: unknown);
}

/**
 * Common types shared across Mimecast API resources
 */
interface MimecastMeta {
    status: number;
    pagination?: {
        pageSize: number;
        next?: string;
        previous?: string;
    };
}
interface MimecastResponse<T> {
    meta: MimecastMeta;
    data: T[];
    fail?: Array<{
        errors: Array<{
            code: string;
            message: string;
            retryable: boolean;
        }>;
    }>;
}
interface PaginationParams {
    pageSize?: number;
    pageToken?: string;
}

export { type AuditEvent, type AuditEventsParams, type MessageInfo, type MessageTrackingParams, MimecastAuthenticationError, MimecastClient, type MimecastConfig, MimecastError, MimecastForbiddenError, type MimecastMeta, MimecastNotFoundError, MimecastRateLimitError, type MimecastRegion, type MimecastResponse, MimecastServerError, MimecastValidationError, type PaginationParams, type QueueDirection, type QueueEntry, type QueueStatus, type ResolvedConfig, type ThreatIncident, type ThreatIncidentsParams, type TokenInfo, type TrackedMessage, type TtpAttachmentLog, type TtpImpersonationLog, type TtpLogsParams, type TtpType, type TtpUrlLog, resolveConfig };
