# Hrive TypeScript SDK

The SDK is a dependency-free, browser-and-Node client for every public Hrive v1 API module.

```ts
import { createHriveClient } from '@/sdk';

const hrive = createHriveClient({
  baseUrl: 'https://hr.example.com',
  retries: 2,
});

await hrive.auth.login({
  email: 'integration@example.com',
  password: process.env.HRIVE_PASSWORD!,
});

const applicants = await hrive.applicants.list({ page: 1, limit: 25 });
const position = await hrive.positions.getById('position-id');
```

You can also supply a token directly or resolve a rotating token for each request:

```ts
const hrive = createHriveClient({
  baseUrl: 'https://hr.example.com',
  getAccessToken: async () => tokenStore.get(),
  timeoutMs: 15_000,
});
```

## Modules

| Property | Public API area |
| --- | --- |
| `auth` | Login and access-token lifecycle |
| `applicants` | CRUD, attachments, avatar, evaluations, links, job applications, matches, recruiter, resumes, source, bulk actions, import/export |
| `applicantSources` | Applicant sources |
| `positions` | CRUD, evaluation assignments, bulk actions, import/export |
| `evaluations` | Expertise/personality catalogs, skill templates, evaluation links |
| `users` | CRUD and Active Directory sync |
| `dashboard` | Dashboard statistics |
| `health` | Platform and database health |
| `jobMatchStatus` | Job-match feature status |
| `recruitmentStages` | Recruitment stages |
| `transitions` | Applicant-stage transitions |
| `settings` | Public v1 settings |
| `logs` | Public v1 logs |
| `notifications` | List and send notifications |
| `uploadQueue` | Upload queue status |
| `ai` | AI applicant search |

## Uploads and downloads

Pass `FormData` directly for multipart endpoints. The SDK intentionally does not set its content type so the runtime can add the correct boundary.

```ts
const form = new FormData();
form.set('files', resumeFile);
await hrive.applicants.bulkUploadCv(form);

const workbook = await hrive.positions.exportData({ department: 'Engineering' });
```

## Errors and custom endpoints

Non-2xx responses throw `HriveApiError`, which includes `status`, parsed `body`, `method`, `url`, and the server request ID when available.

```ts
import { HriveApiError } from '@/sdk';

try {
  await hrive.users.getById('missing');
} catch (error) {
  if (error instanceof HriveApiError && error.status === 404) {
    // Handle a missing user.
  }
}
```

The raw client keeps new or private routes usable before a named SDK method is added:

```ts
const result = await hrive.request<MyResponse>('POST', '/api/v1/new-feature', {
  body: { enabled: true },
  idempotencyKey: crypto.randomUUID(),
});
```

