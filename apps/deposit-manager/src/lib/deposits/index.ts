/**
 * Deposit Management API Service
 * 
 * This file exports the API service to be used throughout the application.
 * 
 * To switch between real API and mock API:
 * 1. Set NEXT_PUBLIC_USE_MOCK_API=true in .env.local to use mock data
 * 2. Set NEXT_PUBLIC_USE_MOCK_API=false or leave unset to use real API
 * 
 * OR manually comment/uncomment the exports below
 */

// ===== AUTOMATIC SWITCHING (based on environment variable) =====
// Uncomment this block for automatic switching:
/*
const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
if (useMockApi) {
  export { mockApi } from './mockApi';
} else {
  export { depositApi as mockApi } from './api';
}
*/

// ===== MANUAL SWITCHING =====
// USE REAL API (ACTIVE)
export { depositApi as mockApi } from './api';
export { depositApi } from './api'; // Also export depositApi directly

// USE MOCK API (for development/testing)
// Uncomment the line below to use mock data
// export { mockApi } from './mockApi';
