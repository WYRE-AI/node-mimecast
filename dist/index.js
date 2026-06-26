// src/config.ts
var REGION_URLS = {
  us: "https://api.services.mimecast.com",
  eu: "https://eu-api.mimecast.com",
  de: "https://de-api.mimecast.com",
  ca: "https://ca-api.mimecast.com",
  za: "https://za-api.mimecast.com",
  au: "https://au-api.mimecast.com",
  offshore: "https://offshore-api.mimecast.com",
  je: "https://je-api.mimecast.com"
};
var DEFAULT_RATE_LIMIT_CONFIG = {
  enabled: true,
  maxRequests: 100,
  windowMs: 6e4,
  throttleThreshold: 0.8,
  retryAfterMs: 5e3,
  maxRetries: 3
};
function resolveConfig(config) {
  let baseUrl;
  let region;
  if (config.baseUrl) {
    baseUrl = config.baseUrl.replace(/\/$/, "");
    region = config.region ?? "us";
  } else {
    region = config.region ?? "us";
    const regionUrl = REGION_URLS[region];
    if (!regionUrl) {
      throw new Error(
        `Invalid region: ${region}. Valid regions are: ${Object.keys(REGION_URLS).join(", ")}`
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
      ...config.rateLimit
    }
  };
}

// src/errors.ts
var MimecastError = class _MimecastError extends Error {
  statusCode;
  response;
  constructor(message, statusCode = 0, response) {
    super(message);
    this.name = "MimecastError";
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, _MimecastError.prototype);
  }
};
var MimecastAuthenticationError = class _MimecastAuthenticationError extends MimecastError {
  constructor(message, statusCode = 401, response) {
    super(message, statusCode, response);
    this.name = "MimecastAuthenticationError";
    Object.setPrototypeOf(this, _MimecastAuthenticationError.prototype);
  }
};
var MimecastForbiddenError = class _MimecastForbiddenError extends MimecastError {
  constructor(message, response) {
    super(message, 403, response);
    this.name = "MimecastForbiddenError";
    Object.setPrototypeOf(this, _MimecastForbiddenError.prototype);
  }
};
var MimecastNotFoundError = class _MimecastNotFoundError extends MimecastError {
  constructor(message, response) {
    super(message, 404, response);
    this.name = "MimecastNotFoundError";
    Object.setPrototypeOf(this, _MimecastNotFoundError.prototype);
  }
};
var MimecastValidationError = class _MimecastValidationError extends MimecastError {
  errors;
  constructor(message, errors = [], response) {
    super(message, 400, response);
    this.name = "MimecastValidationError";
    this.errors = errors;
    Object.setPrototypeOf(this, _MimecastValidationError.prototype);
  }
};
var MimecastRateLimitError = class _MimecastRateLimitError extends MimecastError {
  retryAfter;
  constructor(message, retryAfter = 5e3, response) {
    super(message, 429, response);
    this.name = "MimecastRateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, _MimecastRateLimitError.prototype);
  }
};
var MimecastServerError = class _MimecastServerError extends MimecastError {
  constructor(message, statusCode = 500, response) {
    super(message, statusCode, response);
    this.name = "MimecastServerError";
    Object.setPrototypeOf(this, _MimecastServerError.prototype);
  }
};

// src/auth.ts
var EXPIRY_BUFFER_MS = 2 * 60 * 1e3;
var AuthManager = class {
  config;
  token = null;
  refreshPromise = null;
  constructor(config) {
    this.config = config;
  }
  async getToken() {
    if (this.token && !this.isTokenNearExpiry(this.token)) {
      return this.token.accessToken;
    }
    if (this.refreshPromise) {
      const token2 = await this.refreshPromise;
      return token2.accessToken;
    }
    const token = await this.acquireToken();
    return token.accessToken;
  }
  async refreshToken() {
    this.token = null;
    if (this.refreshPromise) {
      const token2 = await this.refreshPromise;
      return token2.accessToken;
    }
    const token = await this.acquireToken();
    return token.accessToken;
  }
  invalidateToken() {
    this.token = null;
  }
  hasValidToken() {
    return this.token !== null && !this.isTokenNearExpiry(this.token);
  }
  async acquireToken() {
    this.refreshPromise = this.doAcquireToken();
    try {
      const token = await this.refreshPromise;
      this.token = token;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }
  async doAcquireToken() {
    const tokenUrl = `${this.config.baseUrl}/oauth/token`;
    const bodyParams = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });
    let response;
    try {
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });
    } catch (error) {
      throw new MimecastAuthenticationError(
        `Failed to reach Mimecast token endpoint: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        error
      );
    }
    if (!response.ok) {
      const rawText = await response.text();
      let errorBody;
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
    const data = await response.json();
    const expiresAt = Date.now() + data.expires_in * 1e3;
    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresAt
    };
  }
  isTokenNearExpiry(token) {
    return Date.now() >= token.expiresAt - EXPIRY_BUFFER_MS;
  }
};

// src/http.ts
var HttpClient = class {
  config;
  authManager;
  rateLimiter;
  constructor(config, authManager, rateLimiter) {
    this.config = config;
    this.authManager = authManager;
    this.rateLimiter = rateLimiter;
  }
  async request(path, options = {}) {
    const { method = "GET", body, params, skipAuth = false } = options;
    let url = `${this.config.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.executeRequest(url, method, body, skipAuth);
  }
  async executeRequest(url, method, body, skipAuth, retryCount = 0, isRetryAfter401 = false) {
    await this.rateLimiter.waitForSlot();
    const headers = {
      "Content-Type": "application/json"
    };
    if (!skipAuth) {
      const token = await this.authManager.getToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
    this.rateLimiter.recordRequest();
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    return this.handleResponse(
      response,
      url,
      method,
      body,
      skipAuth,
      retryCount,
      isRetryAfter401
    );
  }
  async handleResponse(response, url, method, body, skipAuth, retryCount, isRetryAfter401) {
    if (response.ok) {
      if (response.status === 204) return {};
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return response.json();
      }
      return {};
    }
    const rawText = await response.text();
    let responseBody;
    try {
      responseBody = JSON.parse(rawText);
    } catch {
      responseBody = rawText;
    }
    switch (response.status) {
      case 400:
        throw new MimecastValidationError(
          "Bad request \u2014 invalid parameters",
          this.parseValidationErrors(responseBody),
          responseBody
        );
      case 401:
        if (isRetryAfter401) {
          throw new MimecastAuthenticationError(
            "Authentication failed after token refresh",
            401,
            responseBody
          );
        }
        await this.authManager.refreshToken();
        return this.executeRequest(url, method, body, skipAuth, retryCount, true);
      case 403:
        throw new MimecastForbiddenError(
          "Access forbidden \u2014 insufficient permissions",
          responseBody
        );
      case 404:
        throw new MimecastNotFoundError("Resource not found", responseBody);
      case 429: {
        if (this.rateLimiter.shouldRetry(retryCount)) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const delay = this.rateLimiter.parseRetryAfter(retryAfterHeader);
          await this.sleep(delay);
          return this.executeRequest(url, method, body, skipAuth, retryCount + 1, isRetryAfter401);
        }
        throw new MimecastRateLimitError(
          "Rate limit exceeded and max retries reached",
          5e3,
          responseBody
        );
      }
      default:
        if (response.status >= 500) {
          if (retryCount === 0) {
            await this.sleep(1e3);
            return this.executeRequest(url, method, body, skipAuth, 1, isRetryAfter401);
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
  parseValidationErrors(responseBody) {
    if (typeof responseBody === "object" && responseBody !== null) {
      const body = responseBody;
      const errors = body["errors"] ?? body["fail"];
      if (Array.isArray(errors)) {
        return errors.map((err) => {
          if (typeof err === "object" && err !== null) {
            const e = err;
            return {
              field: String(e["field"] ?? e["key"] ?? "unknown"),
              message: String(e["message"] ?? e["msg"] ?? "Unknown error")
            };
          }
          return { field: "unknown", message: String(err) };
        });
      }
    }
    return [];
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/rate-limiter.ts
var RateLimiter = class {
  config;
  requestTimestamps = [];
  constructor(config) {
    this.config = config;
  }
  async waitForSlot() {
    if (!this.config.enabled) return;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > windowStart);
    const requestCount = this.requestTimestamps.length;
    const throttleAt = Math.floor(this.config.maxRequests * this.config.throttleThreshold);
    if (requestCount >= this.config.maxRequests) {
      const oldestInWindow = this.requestTimestamps[0];
      if (oldestInWindow) {
        const waitMs = oldestInWindow + this.config.windowMs - now + 10;
        if (waitMs > 0) {
          await this.sleep(waitMs);
        }
      }
    } else if (requestCount >= throttleAt) {
      await this.sleep(200);
    }
  }
  recordRequest() {
    this.requestTimestamps.push(Date.now());
  }
  shouldRetry(retryCount) {
    return retryCount < this.config.maxRetries;
  }
  parseRetryAfter(retryAfterHeader) {
    if (!retryAfterHeader) return this.config.retryAfterMs;
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) return seconds * 1e3;
    return this.config.retryAfterMs;
  }
  handleRateLimitError(retryCount) {
    const delay = this.config.retryAfterMs * Math.pow(2, retryCount);
    return void delay;
  }
  getRemainingRequests() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const active = this.requestTimestamps.filter((ts) => ts > windowStart).length;
    return Math.max(0, this.config.maxRequests - active);
  }
  getCurrentRate() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    return this.requestTimestamps.filter((ts) => ts > windowStart).length;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/resources/messages.ts
var MessagesResource = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  httpClient;
  /**
   * Search for messages using tracking API
   */
  async find(params) {
    const response = await this.httpClient.request(
      "/api/message-finder/search",
      {
        method: "POST",
        body: {
          meta: {
            pagination: {
              pageSize: params?.pageSize ?? 50,
              ...params?.pageToken ? { pageToken: params.pageToken } : {}
            }
          },
          data: [
            {
              ...params?.value ? { value: params.value } : {},
              ...params?.from ? { from: params.from } : {},
              ...params?.to ? { to: params.to } : {},
              ...params?.senderAddress ? { senderAddress: params.senderAddress } : {},
              ...params?.recipientAddress ? { recipientAddress: params.recipientAddress } : {},
              ...params?.messageStatus ? { messageStatus: params.messageStatus } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return data;
  }
  /**
   * Get detailed message information by ID
   */
  async getInfo(id) {
    const response = await this.httpClient.request(
      "/api/message-finder/get-message-info",
      {
        method: "POST",
        body: {
          data: [{ id }]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    const item = Array.isArray(data) ? data[0] : data;
    return item;
  }
  /**
   * Place a message on hold
   */
  async hold(id, reason) {
    const response = await this.httpClient.request(
      "/api/gateway/hold-message",
      {
        method: "POST",
        body: {
          data: [
            {
              id,
              ...reason ? { reason } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    const item = Array.isArray(data) ? data[0] : data;
    return { success: true, id: item?.id ?? id };
  }
  /**
   * Release a held message
   */
  async release(id) {
    const response = await this.httpClient.request(
      "/api/gateway/release-message",
      {
        method: "POST",
        body: {
          data: [{ id }]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    const item = Array.isArray(data) ? data[0] : data;
    return { success: true, id: item?.id ?? id };
  }
};

// src/resources/threats.ts
var ThreatsResource = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  httpClient;
  /**
   * Get threat remediation incidents
   */
  async getIncidents(params) {
    const response = await this.httpClient.request(
      "/api/ttp/remediation/get-incidents",
      {
        method: "POST",
        body: {
          meta: {
            pagination: {
              pageSize: params?.pageSize ?? 50,
              ...params?.pageToken ? { pageToken: params.pageToken } : {}
            }
          },
          data: [
            {
              ...params?.status ? { status: params.status } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return data;
  }
  /**
   * Get TTP URL protection logs
   */
  async getUrlLogs(params) {
    const response = await this.httpClient.request(
      "/api/ttp/url/get-logs",
      {
        method: "POST",
        body: {
          meta: {
            pagination: {
              pageSize: params.pageSize ?? 50,
              ...params.pageToken ? { pageToken: params.pageToken } : {}
            }
          },
          data: [
            {
              ...params.from ? { from: params.from } : {},
              ...params.to ? { to: params.to } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return Array.isArray(data) ? data[0] : data;
  }
  /**
   * Get TTP attachment protection logs
   */
  async getAttachmentLogs(params) {
    const response = await this.httpClient.request(
      "/api/ttp/attachment/get-logs",
      {
        method: "POST",
        body: {
          meta: {
            pagination: {
              pageSize: params.pageSize ?? 50,
              ...params.pageToken ? { pageToken: params.pageToken } : {}
            }
          },
          data: [
            {
              ...params.from ? { from: params.from } : {},
              ...params.to ? { to: params.to } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return Array.isArray(data) ? data[0] : data;
  }
  /**
   * Get TTP impersonation protection logs
   */
  async getImpersonationLogs(params) {
    const response = await this.httpClient.request(
      "/api/ttp/impersonation/get-logs",
      {
        method: "POST",
        body: {
          meta: {
            pagination: {
              pageSize: params.pageSize ?? 50,
              ...params.pageToken ? { pageToken: params.pageToken } : {}
            }
          },
          data: [
            {
              ...params.from ? { from: params.from } : {},
              ...params.to ? { to: params.to } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return Array.isArray(data) ? data[0] : data;
  }
  /**
   * Get audit log events
   */
  async getAuditEvents(params) {
    const response = await this.httpClient.request(
      "/api/audit/get-audit-events",
      {
        method: "POST",
        body: {
          meta: {
            pagination: {
              pageSize: params?.pageSize ?? 50,
              ...params?.pageToken ? { pageToken: params.pageToken } : {}
            }
          },
          data: [
            {
              ...params?.from ? { startDateTime: params.from } : {},
              ...params?.to ? { endDateTime: params.to } : {},
              ...params?.categories ? { categories: params.categories } : {}
            }
          ]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    return data;
  }
};

// src/resources/queue.ts
var QueueResource = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  httpClient;
  /**
   * Get email delivery queue status
   */
  async getStatus() {
    const response = await this.httpClient.request(
      "/api/gateway/get-queue-stats",
      {
        method: "POST",
        body: {
          data: [{}]
        }
      }
    );
    const data = Array.isArray(response) ? response : response?.data ?? [];
    const item = Array.isArray(data) ? data[0] : data;
    return item ?? {};
  }
};

// src/client.ts
var MimecastClient = class {
  config;
  authManager;
  rateLimiter;
  httpClient;
  /** Message tracking and hold management */
  messages;
  /** Threat intelligence (TTP, remediation, audit) */
  threats;
  /** Email delivery queue */
  queue;
  constructor(config) {
    this.config = resolveConfig(config);
    this.authManager = new AuthManager(this.config);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.httpClient = new HttpClient(this.config, this.authManager, this.rateLimiter);
    this.messages = new MessagesResource(this.httpClient);
    this.threats = new ThreatsResource(this.httpClient);
    this.queue = new QueueResource(this.httpClient);
  }
  getConfig() {
    return this.config;
  }
  invalidateToken() {
    this.authManager.invalidateToken();
  }
  getRateLimitStatus() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      rate: this.rateLimiter.getCurrentRate()
    };
  }
};
export {
  MimecastAuthenticationError,
  MimecastClient,
  MimecastError,
  MimecastForbiddenError,
  MimecastNotFoundError,
  MimecastRateLimitError,
  MimecastServerError,
  MimecastValidationError,
  resolveConfig
};
//# sourceMappingURL=index.js.map