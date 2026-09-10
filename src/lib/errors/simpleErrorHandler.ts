import { NextRequest } from 'next/server';
import { getAllowedOrigin } from '@/lib/cors';

export interface SimpleErrorResponse {
  error: string;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

export interface SimpleSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

/**
 * Simple error handler - focused on essential error handling
 */
export class SimpleErrorHandler {
  /**
   * Create error response
   */
  static createErrorResponse(
    req: NextRequest,
    error: Error | string,
    statusCode: number = 500
  ): Response {
    // SECURITY: Never expose detailed error information in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // In production, use generic error messages for security
    const safeErrorMessage = isDevelopment 
      ? errorMessage 
      : (statusCode >= 500 ? 'An internal server error occurred' : errorMessage);
    
    const errorResponse: SimpleErrorResponse = {
      error: safeErrorMessage,
      timestamp: new Date().toISOString(),
      path: req.nextUrl?.pathname || req.url,
      method: req.method,
      statusCode,
    };

    // SECURITY: Use proper CORS validation instead of wildcard
    const allowedOrigin = getAllowedOrigin(req);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Only add CORS headers if origin is allowed
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers,
    });
  }

  /**
   * Create success response
   */
  static createSuccessResponse<T>(
    req: NextRequest,
    data: T,
    statusCode: number = 200
  ): Response {
    const successResponse: SimpleSuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      path: req.nextUrl?.pathname || req.url,
      method: req.method,
      statusCode,
    };

    // SECURITY: Use proper CORS validation instead of wildcard
    const allowedOrigin = getAllowedOrigin(req);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Only add CORS headers if origin is allowed
    if (allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = allowedOrigin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return new Response(JSON.stringify(successResponse), {
      status: statusCode,
      headers,
    });
  }

  /**
   * Handle API errors with common error types
   */
  static handleApiError(req: NextRequest, error: unknown): Response {
    if (error instanceof Error) {
      // Handle common error types
      if (error.name === 'ValidationError') {
        return this.createErrorResponse(req, 'Validation Error', 400);
      }
      
      if (error.name === 'UnauthorizedError') {
        return this.createErrorResponse(req, 'Unauthorized', 401);
      }
      
      if (error.name === 'ForbiddenError') {
        return this.createErrorResponse(req, 'Forbidden', 403);
      }
      
      if (error.name === 'NotFoundError') {
        return this.createErrorResponse(req, 'Not Found', 404);
      }
      
      if (error.name === 'ConflictError') {
        return this.createErrorResponse(req, 'Conflict', 409);
      }

      // Default error handling
      return this.createErrorResponse(req, error, 500);
    }

    // Handle unknown errors
    const errorMessage = typeof error === 'string' ? error : 'An unexpected error occurred';
    return this.createErrorResponse(req, errorMessage, 500);
  }
}

// Convenience functions for common error types
export const createValidationError = (message: string = 'Validation Error') => 
  new Error(message);

export const createUnauthorizedError = (message: string = 'Unauthorized') => {
  const error = new Error(message);
  error.name = 'UnauthorizedError';
  return error;
};

export const createForbiddenError = (message: string = 'Forbidden') => {
  const error = new Error(message);
  error.name = 'ForbiddenError';
  return error;
};

export const createNotFoundError = (message: string = 'Not Found') => {
  const error = new Error(message);
  error.name = 'NotFoundError';
  return error;
};

export const createConflictError = (message: string = 'Conflict') => {
  const error = new Error(message);
  error.name = 'ConflictError';
  return error;
};

export const createInternalServerError = (message: string = 'Internal Server Error') => {
  const error = new Error(message);
  error.name = 'InternalServerError';
  return error;
};