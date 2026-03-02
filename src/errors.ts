/**
 * Custom error classes for the Mimecast client
 */

/**
 * Base error class for all Mimecast errors
 */
export class MimecastError extends Error {
  readonly statusCode: number;
  readonly response: unknown;

  constructor(message: string, statusCode: number = 0, response?: unknown) {
    super(message);
    this.name = 'MimecastError';
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, MimecastError.prototype);
  }
}

/**
 * Authentication error (401 unauthorized, invalid credentials)
 */
export class MimecastAuthenticationError extends MimecastError {
  constructor(message: string, statusCode: number = 401, response?: unknown) {
    super(message, statusCode, response);
    this.name = 'MimecastAuthenticationError';
    Object.setPrototypeOf(this, MimecastAuthenticationError.prototype);
  }
}

/**
 * Forbidden error (403 permission denied)
 */
export class MimecastForbiddenError extends MimecastError {
  constructor(message: string, response?: unknown) {
    super(message, 403, response);
    this.name = 'MimecastForbiddenError';
    Object.setPrototypeOf(this, MimecastForbiddenError.prototype);
  }
}

/**
 * Resource not found error (404)
 */
export class MimecastNotFoundError extends MimecastError {
  constructor(message: string, response?: unknown) {
    super(message, 404, response);
    this.name = 'MimecastNotFoundError';
    Object.setPrototypeOf(this, MimecastNotFoundError.prototype);
  }
}

/**
 * Validation error (400 with field-level errors)
 */
export class MimecastValidationError extends MimecastError {
  readonly errors: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    errors: Array<{ field: string; message: string }> = [],
    response?: unknown
  ) {
    super(message, 400, response);
    this.name = 'MimecastValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, MimecastValidationError.prototype);
  }
}

/**
 * Rate limit exceeded error (429)
 */
export class MimecastRateLimitError extends MimecastError {
  readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 5000, response?: unknown) {
    super(message, 429, response);
    this.name = 'MimecastRateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, MimecastRateLimitError.prototype);
  }
}

/**
 * Server error (500+)
 */
export class MimecastServerError extends MimecastError {
  constructor(message: string, statusCode: number = 500, response?: unknown) {
    super(message, statusCode, response);
    this.name = 'MimecastServerError';
    Object.setPrototypeOf(this, MimecastServerError.prototype);
  }
}
