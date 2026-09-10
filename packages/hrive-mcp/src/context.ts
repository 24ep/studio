import { HriveClient } from '@outborn/hrive-sdk';

export function hriveClient() {
  const baseUrl = String(process.env.HRIVE_BASE_URL || process.env.HRIVE_URL || 'https://people.outborn.co').trim();
  const token = String(process.env.HRIVE_TOKEN || '').trim();
  if (!token) throw new Error('HRIVE_TOKEN is required');
  return new HriveClient({ baseUrl, token });
}

export function writesAllowed() {
  return ['1', 'true', 'yes', 'on'].includes(String(process.env.HRIVE_MCP_ALLOW_WRITES || '').trim().toLowerCase());
}

export function assertWritesAllowed() {
  if (!writesAllowed()) {
    throw new Error('Hrive MCP is read-only. Set HRIVE_MCP_ALLOW_WRITES=true to enable mutating tools.');
  }
}

export function result(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  };
}
