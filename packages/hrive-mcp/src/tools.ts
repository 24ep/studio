import type { McpServer } from '@modelcontextprotocol/server';
import type { HriveQuery } from '@outborn/hrive-sdk';
import * as z from 'zod/v4';
import { assertWritesAllowed, hriveClient, result, writesAllowed } from './context.js';

const listSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  search: z.string().max(240).optional(),
  searchTerm: z.string().max(240).optional(),
  status: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  department: z.string().max(160).optional(),
  isOpen: z.boolean().optional(),
});

const idSchema = z.object({ id: z.string().min(1).max(240) });
const payloadSchema = z.object({ payload: z.record(z.string(), z.unknown()) });
const queryValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const querySchema = z.record(z.string(), queryValueSchema);

export function registerHriveTools(server: McpServer) {
  server.registerTool(
    'hrive_capabilities',
    {
      description: 'Return the Hrive MCP connection mode and whether mutating tools are enabled for this server process.',
      inputSchema: z.object({}),
    },
    async () => result({
      service: 'Hrive',
      baseUrl: String(process.env.HRIVE_BASE_URL || process.env.HRIVE_URL || 'https://people.outborn.co'),
      authentication: 'Bearer token',
      writesAllowed: writesAllowed(),
      apiNamespace: '/api/v1',
    }),
  );

  server.registerTool(
    'hrive_health',
    {
      description: 'Check Hrive API and database health using the configured Hrive connection.',
      inputSchema: z.object({}),
    },
    async () => result(await hriveClient().health()),
  );

  server.registerTool(
    'hrive_list_applicants',
    {
      description: 'List Hrive applicants with pagination and common filters.',
      inputSchema: listSchema,
    },
    async (input) => result(await hriveClient().listApplicants(input)),
  );

  server.registerTool(
    'hrive_get_applicant',
    {
      description: 'Get one Hrive applicant by id.',
      inputSchema: idSchema,
    },
    async ({ id }) => result(await hriveClient().getApplicant(id)),
  );

  server.registerTool(
    'hrive_create_applicant',
    {
      description: 'Create a Hrive applicant. Requires HRIVE_MCP_ALLOW_WRITES=true and the Hrive token must have the required permission.',
      inputSchema: payloadSchema,
    },
    async ({ payload }) => {
      assertWritesAllowed();
      return result(await hriveClient().createApplicant(payload));
    },
  );

  server.registerTool(
    'hrive_list_positions',
    {
      description: 'List Hrive positions with pagination and common filters.',
      inputSchema: listSchema,
    },
    async (input) => result(await hriveClient().listPositions(input)),
  );

  server.registerTool(
    'hrive_get_position',
    {
      description: 'Get one Hrive position by id.',
      inputSchema: idSchema,
    },
    async ({ id }) => result(await hriveClient().getPosition(id)),
  );

  server.registerTool(
    'hrive_create_position',
    {
      description: 'Create a Hrive position. Requires HRIVE_MCP_ALLOW_WRITES=true and the Hrive token must have the required permission.',
      inputSchema: payloadSchema,
    },
    async ({ payload }) => {
      assertWritesAllowed();
      return result(await hriveClient().createPosition(payload));
    },
  );

  server.registerTool(
    'hrive_list_users',
    {
      description: 'List Hrive users with pagination, role, and search filters.',
      inputSchema: listSchema,
    },
    async (input) => result(await hriveClient().listUsers(input)),
  );

  server.registerTool(
    'hrive_get_user',
    {
      description: 'Get one Hrive user by id.',
      inputSchema: idSchema,
    },
    async ({ id }) => result(await hriveClient().getUser(id)),
  );

  server.registerTool(
    'hrive_list_recruitment_stages',
    {
      description: 'List recruitment stages from the Hrive V1 API.',
      inputSchema: z.object({ query: querySchema.optional() }),
    },
    async ({ query }) => result(await hriveClient().listRecruitmentStages((query || {}) as HriveQuery)),
  );

  server.registerTool(
    'hrive_list_notifications',
    {
      description: 'List notifications visible to the authenticated Hrive user.',
      inputSchema: z.object({ query: querySchema.optional() }),
    },
    async ({ query }) => result(await hriveClient().listNotifications((query || {}) as HriveQuery)),
  );

  server.registerTool(
    'hrive_api_get',
    {
      description: 'Call any GET endpoint inside Hrive /api/v1. Use this for V1 resources that do not yet have a dedicated MCP tool.',
      inputSchema: z.object({
        path: z.string().min(1).max(300),
        query: querySchema.optional(),
      }),
    },
    async ({ path, query }) => result(await hriveClient().raw({
      path,
      method: 'GET',
      query: (query || {}) as HriveQuery,
    })),
  );

  server.registerTool(
    'hrive_api_mutate',
    {
      description: 'Call a mutating Hrive /api/v1 endpoint. Disabled unless HRIVE_MCP_ALLOW_WRITES=true; Hrive permission checks still apply.',
      inputSchema: z.object({
        path: z.string().min(1).max(300),
        method: z.enum(['POST', 'PUT', 'PATCH', 'DELETE']),
        query: querySchema.optional(),
        body: z.unknown().optional(),
      }),
    },
    async ({ path, method, query, body }) => {
      assertWritesAllowed();
      return result(await hriveClient().raw({
        path,
        method,
        query: (query || {}) as HriveQuery,
        body,
      }));
    },
  );
}
