// Main error handler - use this for most operations
export { SimpleErrorHandler } from './simpleErrorHandler';

// Convenience error creators
export { 
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createInternalServerError
} from './simpleErrorHandler';

// Types
export type { SimpleErrorResponse, SimpleSuccessResponse } from './simpleErrorHandler';
