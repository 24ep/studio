import { type NextRequest } from 'next/server';
import { handleGetV1Settings, handleV1SettingsOptions } from './settings-v1-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/v1/settings:
 *   get:
 *     summary: Get system settings (V1 API)
 *     description: Returns system settings and configuration. Requires Bearer token authentication and Admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemSettings:
 *                       type: object
 *                       properties:
 *                         defaultMatchCriteria:
 *                           type: object
 *                         emailSettings:
 *                           type: object
 *                         fileUploadSettings:
 *                           type: object
 *                     userPreferences:
 *                       type: object
 *                     customFields:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           isRequired:
 *                             type: boolean
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 path:
 *                   type: string
 *                 method:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   success: true
 *                   data:
 *                     systemSettings:
 *                       defaultMatchCriteria:
 *                         minScore: 70
 *                         requiredSkills: ["JavaScript", "React"]
 *                       emailSettings:
 *                         smtpHost: "smtp.example.com"
 *                         smtpPort: 587
 *                       fileUploadSettings:
 *                         maxFileSize: 10485760
 *                         allowedTypes: ["pdf", "doc", "docx"]
 *                     userPreferences:
 *                       theme: "light"
 *                       language: "en"
 *                       timezone: "UTC"
 *                     customFields:
 *                       - id: "123e4567-e89b-12d3-a456-426614174000"
 *                         name: "Preferred Location"
 *                         type: "select"
 *                         isRequired: false
 *                         options: ["Remote", "On-site", "Hybrid"]
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   path: "/api/v1/settings"
 *                   method: "GET"
 *                   statusCode: 200
 *       401:
 *         description: Unauthorized - Invalid or missing Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized - Invalid or expired token"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden - Admin role required"
 *       500:
 *         description: Internal server error
 */
export function GET(request: NextRequest) {
  return handleGetV1Settings(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleV1SettingsOptions(request);
}
