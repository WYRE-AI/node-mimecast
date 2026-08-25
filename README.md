# node-mimecast

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A Node.js/TypeScript client library for the [Mimecast](https://www.mimecast.com/) Email Security API — message tracking and hold management, threat intelligence (TTP/remediation/audit), and delivery queue status.

## Installation

```bash
npm install @wyre-ai/node-mimecast
```

## Usage

```typescript
import { MimecastClient } from '@wyre-ai/node-mimecast';

const client = new MimecastClient({
  clientId: process.env.MIMECAST_CLIENT_ID!,
  clientSecret: process.env.MIMECAST_CLIENT_SECRET!,
  region: 'us',
});

// Find messages
const messages = await client.messages.find({ senderAddress: 'attacker@evil.com' });

// Get TTP URL logs
const urlLogs = await client.threats.getUrlLogs({ type: 'url' });

// Check queue status
const queue = await client.queue.getStatus();
```

Create OAuth2 API credentials in the Mimecast Administration Console — see the [Mimecast API overview](https://developer.services.mimecast.com/api-overview/global-base-urls) for the full authentication and regional-endpoint reference. `region` selects the correct Mimecast data-center base URL (`us`, `eu`, `de`, `ca`, `za`, `au`, `offshore`, `je`).

## Resources

| Resource | Covers |
|---|---|
| `messages` | Message tracking and hold management |
| `threats` | Threat intelligence — TTP URL/attachment/impersonation logs, remediation, audit |
| `queue` | Email delivery queue status |

The client handles OAuth2 token acquisition/refresh and rate limiting internally. Errors surface as one of `MimecastAuthenticationError`, `MimecastForbiddenError`, `MimecastNotFoundError`, `MimecastValidationError`, `MimecastRateLimitError`, `MimecastServerError`, or the base `MimecastError` (all exported from the package root).

## Development

```bash
npm run build       # tsup build (ESM + CJS)
npm test            # vitest
npm run lint
npm run typecheck
```

Releases are automated via semantic-release on merge to `main`.

## License

MIT
