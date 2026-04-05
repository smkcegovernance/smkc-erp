/**
 * @smkc/api-client
 *
 * Two-layer API client:
 *
 *  - `apiServer`  Server-side only. Use in Next.js Route Handlers (app/api).
 *                 Signs requests with HMAC-SHA256 and unwraps .NET ApiResponse envelopes.
 *
 *  - `apiClient`  Client-side only ('use client'). Calls internal Next.js API routes.
 *                 Never exposes HMAC secrets or the backend URL to the browser.
 */
export { apiServer } from './server'
export { apiClient } from './client'
export { signRequest, buildAuthHeaders, unixTimestampSeconds } from './hmac'
