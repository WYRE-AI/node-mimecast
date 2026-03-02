/**
 * node-mimecast — Mimecast Email Security API client for Node.js
 *
 * @packageDocumentation
 */

export { MimecastClient } from './client.js';
export { resolveConfig } from './config.js';
export type { MimecastConfig, ResolvedConfig, MimecastRegion } from './config.js';
export {
  MimecastError,
  MimecastAuthenticationError,
  MimecastForbiddenError,
  MimecastNotFoundError,
  MimecastValidationError,
  MimecastRateLimitError,
  MimecastServerError,
} from './errors.js';
export type { TokenInfo } from './auth.js';
export type * from './types/index.js';
