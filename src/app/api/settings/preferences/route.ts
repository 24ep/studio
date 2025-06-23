/**
 * @openapi
 * /api/settings/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Returns the current user's UI display preferences. Requires authentication.
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   candidateAttributes:
 *                     name: { uiPreference: "Standard", customNote: "" }
 *                   positionAttributes:
 *                     title: { uiPreference: "Standard", customNote: "" }
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Update user preferences
 *     description: Updates the current user's UI display preferences. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 candidateAttributes:
 *                   name: { uiPreference: "Emphasized", customNote: "Highlight this field" }
 *     responses:
 *       200:
 *         description: Preferences updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   candidateAttributes:
 *                     name: { uiPreference: "Emphasized", customNote: "Highlight this field" }
 *       401:
 *         description: Unauthorized
 */
// ... existing code ... 