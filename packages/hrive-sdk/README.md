# @outborn/hrive-sdk

Typed client for the Hrive HRIS API.

## Install

```bash
npm config set @outborn:registry https://registry.outborn.co
npm add @outborn/hrive-sdk
```

## Usage

```ts
import { createHriveClient } from '@outborn/hrive-sdk';

const hrive = createHriveClient({
  baseUrl: 'https://people.outborn.co',
});

await hrive.login({
  email: process.env.HRIVE_EMAIL!,
  password: process.env.HRIVE_PASSWORD!,
});

const applicants = await hrive.listApplicants({ page: 1, limit: 25 });
const positions = await hrive.listPositions({ isOpen: true });
```

For long-running integrations, pass an existing Hrive JWT as `token` instead of storing a password in the integration process.

## Generic V1 access

The SDK exposes `raw()` for Hrive V1 endpoints that do not yet have a first-class helper:

```ts
const response = await hrive.raw({
  path: 'dashboard',
  method: 'GET',
});
```

Paths are constrained to the Hrive `/api/v1` namespace by the client path resolver.

## Authentication

Hrive V1 uses Bearer authentication. `login()` calls `/api/v1/auth/login` and automatically stores the returned token on the client. You can also call `setToken()` to rotate a token without recreating the client.

## Errors

Non-2xx responses throw `HriveApiError` with `status`, `statusText`, `url`, and the parsed response `body`.
