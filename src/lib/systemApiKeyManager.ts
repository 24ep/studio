/**
 * System API Key Manager
 *
 * Public facade for v2 API key creation, validation, and management.
 */

export {
  generateApiKey,
  getKeyDisplayPrefix,
  hashApiKey,
  maskApiKey,
} from "./system-api-keys/system-api-key-crypto";
export { createApiKey } from "./system-api-keys/system-api-key-create";
export { getApiKeyById, listApiKeys } from "./system-api-keys/system-api-key-read";
export { validateApiKey } from "./system-api-keys/system-api-key-validate";
export { deleteApiKey, revokeApiKey, updateApiKey } from "./system-api-keys/system-api-key-write";
export type {
  ApiKeyData,
  CreateApiKeyInput,
  CreateApiKeyResult,
  ValidateApiKeyResult,
} from "./system-api-keys/system-api-key-types";
