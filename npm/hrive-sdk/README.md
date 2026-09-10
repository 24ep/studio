# Hrive TypeScript SDK

A dependency-free, browser-and-Node client for the Hrive public API.

```bash
npm install hrive-sdk
```

```ts
import { createHriveClient } from 'hrive-sdk';

const hrive = createHriveClient({
  baseUrl: 'https://hr.example.com',
  retries: 2,
});

await hrive.auth.login({
  email: 'integration@example.com',
  password: process.env.HRIVE_PASSWORD!,
});

const applicants = await hrive.applicants.list({ page: 1, limit: 25 });
```

The SDK includes authentication, applicants, applicant sources, positions,
evaluations, users, dashboard and health endpoints, recruitment stages,
transitions, settings, logs, notifications, upload queues, and AI search.

It supports rotating access tokens, timeouts, safe-request retries, multipart
uploads, binary downloads, structured `HriveApiError` errors, and a raw
`request()` escape hatch for newly introduced endpoints.

Requires Node.js 18 or newer when used in Node. Modern browsers with the Fetch
API are supported.
