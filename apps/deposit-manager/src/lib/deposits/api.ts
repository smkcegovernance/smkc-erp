'use client';

import { Bank, BankAPI, DepositRequirement, BankQuote, DashboardStats, ApiResponse, DepositRequirementAPI, RequirementDetailsAPI, mapRequirementFromAPI, mapRequirementToAPI, mapBankFromAPI, mapBankToAPI, ConsentDocumentResponse, SubmitQuotePayload, UserProfile, ChangePasswordPayload } from './types';
import CryptoJS from 'crypto-js';

// API Base URL - should be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:5443';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'TEST_API_KEY_12345678901234567890123456789012';
const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || 'TEST_SECRET_KEY_67890ABCDEFGHIJ1234567890';

function redactSensitive(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }

  if (typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      if (/password|secret|signature|token|api[-_]?key/i.test(key)) {
        redacted[key] = '***masked***';
      } else {
        redacted[key] = redactSensitive(fieldValue);
      }
    }
    return redacted;
  }

  return value;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function friendlyHttpErrorMessage(status: number, fallback?: string): string {
  if (status === 400) return 'The request is invalid. Please check the entered details and try again.';
  if (status === 401) return 'Login failed. Please check your User ID and Password.';
  if (status === 403) return 'Your account does not have permission to sign in.';
  if (status === 404) return 'Login service is currently unavailable. Please try again shortly.';
  if (status === 408) return 'The request timed out. Please check your connection and try again.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'Server is temporarily unavailable. Please try again in a few minutes.';
  return fallback || 'Something went wrong. Please try again.';
}

function sanitizeLoginMessage(message: string): string {
  const text = (message || '').trim();
  if (!text) return 'Unable to sign in right now. Please try again.';

  if (/^http\s+401/i.test(text) || /unauthori[sz]ed|invalid credential/i.test(text)) {
    return friendlyHttpErrorMessage(401);
  }
  if (/^http\s+403/i.test(text) || /forbidden|access denied/i.test(text)) {
    return friendlyHttpErrorMessage(403);
  }
  if (/^http\s+404/i.test(text) || /not found/i.test(text)) {
    return friendlyHttpErrorMessage(404);
  }
  if (/^http\s+408/i.test(text) || /timeout/i.test(text)) {
    return friendlyHttpErrorMessage(408);
  }
  if (/^http\s+429/i.test(text) || /too many/i.test(text)) {
    return friendlyHttpErrorMessage(429);
  }
  if (/^http\s+5\d\d/i.test(text) || /server error|internal server/i.test(text)) {
    return friendlyHttpErrorMessage(500);
  }

  return text;
}

function buildBackendUrl(apiPath: string): string {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  let path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const baseHasApi = /\/api$/i.test(base);
  const pathStartsWithApi = /^\/api\//i.test(path);
  if (baseHasApi && pathStartsWithApi) {
    path = path.replace(/^\/api/i, '');
  }
  if (!baseHasApi && !pathStartsWithApi) {
    path = `/api${path}`;
  }
  return `${base}${path}`;
}

function buildQueryFromParams(params: URLSearchParams, excludeKeys: string[] = []): string {
  const q = new URLSearchParams();
  params.forEach((value, key) => {
    if (!excludeKeys.includes(key)) {
      q.append(key, value);
    }
  });
  const query = q.toString();
  return query ? `?${query}` : '';
}

function toNumber(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstMeaningfulValue(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const text = String(value).trim();
    if (!text) {
      continue;
    }

    const lowered = text.toLowerCase();
    if (lowered === 'n/a' || lowered === 'na' || lowered === 'null' || lowered === 'undefined') {
      continue;
    }

    return text;
  }

  return undefined;
}

function resolveProxyBackendMapping(url: string, method: string): { backendPath?: string; backendUrl?: string; note?: string } | null {
  const parsed = new URL(url, 'http://localhost');
  const pathname = parsed.pathname;
  const params = parsed.searchParams;
  const role = params.get('role') || 'account';

  if (!pathname.startsWith('/depositmanager/api/proxy/')) {
    return null;
  }

  if (pathname === '/depositmanager/api/proxy/login') {
    const backendPath = '/api/auth/login';
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/dashboard') {
    let backendPath = `/api/deposits/${role}/dashboard/stats`;
    const bankId = params.get('bankId');
    if (role === 'bank' && bankId) {
      backendPath += `?bankId=${encodeURIComponent(bankId)}`;
    }
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/commissioner-dashboard') {
    const metric = params.get('metric') || '';
    const metricMap: Record<string, string> = {
      'enhanced-kpis': 'enhanced-kpis',
      'bank-wise': 'bank-wise-analytics',
      'upcoming-maturities': 'upcoming-maturities',
      'deposit-type-distribution': 'deposit-type-distribution',
      timeline: 'interest-timeline',
      'portfolio-health': 'portfolio-health',
    };

    const mappedMetric = metricMap[metric];
    if (!mappedMetric) {
      return { note: `Unknown commissioner dashboard metric: ${metric}` };
    }

    const backendPath = `/api/deposits/commissioner/dashboard/${mappedMetric}${buildQueryFromParams(params, ['metric'])}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/requirements') {
    const backendPath = method.toUpperCase() === 'POST'
      ? '/api/deposits/account/requirements'
      : `/api/deposits/${role}/requirements${buildQueryFromParams(params, ['role'])}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/requirements/create') {
    const backendPath = '/api/deposits/account/requirements';
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  const requirementIdActionMatch = pathname.match(/^\/depositmanager\/api\/proxy\/requirements\/([^/]+)\/(authorize|finalize|publish)$/i);
  if (requirementIdActionMatch) {
    const requirementId = requirementIdActionMatch[1];
    const action = requirementIdActionMatch[2].toLowerCase();
    const backendPath = action === 'authorize'
      ? `/api/deposits/commissioner/requirements/${requirementId}/authorize`
      : action === 'finalize'
      ? `/api/deposits/commissioner/requirements/${requirementId}/finalize`
      : `/api/deposits/account/requirements/${requirementId}/publish`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  const requirementIdMatch = pathname.match(/^\/depositmanager\/api\/proxy\/requirements\/([^/]+)$/i);
  if (requirementIdMatch) {
    const requirementId = requirementIdMatch[1];
    const backendPath = method.toUpperCase() === 'PUT'
      ? `/api/deposits/account/requirements/${requirementId}`
      : `/api/deposits/${role}/requirements/${requirementId}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/quotes') {
    const backendPath = `/api/deposits/${role}/quotes${buildQueryFromParams(params, ['role'])}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/quotes/submit') {
    const backendPath = '/api/deposits/bank/quotes/submit';
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/banks') {
    const backendPath = `/api/deposits/account/banks${buildQueryFromParams(params)}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/banks/create') {
    const backendPath = '/api/deposits/account/banks/create';
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  const bankIdMatch = pathname.match(/^\/depositmanager\/api\/proxy\/banks\/([^/]+)$/i);
  if (bankIdMatch) {
    const bankId = bankIdMatch[1];
    const backendPath = `/api/deposits/account/banks/${bankId}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  if (pathname === '/depositmanager/api/proxy/reports') {
    const backendPath = `/api/deposits/${role}/reports${buildQueryFromParams(params, ['role'])}`;
    return { backendPath, backendUrl: buildBackendUrl(backendPath) };
  }

  return {
    note: `Proxy mapping not configured for ${pathname}`,
  };
}

// Generate HMAC-SHA256 signature
function generateHmacSignature(
  method: string,
  uri: string,
  body: string,
  timestamp: string,
  apiKey: string,
  secretKey: string
): string {
  const stringToSign = method + uri + body + timestamp + apiKey;
  return CryptoJS.HmacSHA256(stringToSign, secretKey).toString(CryptoJS.enc.Base64);
}

// Helper function to make API calls (proxy routes don't need HMAC)
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // All endpoints now go through proxy routes which handle HMAC internally
  const url = endpoint.startsWith('http') ? endpoint : endpoint;
  const method = options.method || 'GET';
  const debugId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const requestBodyRaw = typeof config.body === 'string' ? config.body : '';
  const requestBodyForLog = requestBodyRaw ? redactSensitive(safeParseJson(requestBodyRaw)) : 'empty';
  const proxyBackendMapping = resolveProxyBackendMapping(url, method);

  console.groupCollapsed(`[API Debug ${debugId}] ${method} ${url}`);
  console.log('[API Debug] Request', {
    endpoint,
    url,
    method,
    headers: redactSensitive(config.headers),
    body: requestBodyForLog,
  });
  if (proxyBackendMapping) {
    console.log('[API Debug] Proxy -> Backend mapping', proxyBackendMapping);
  }

  try {
    const response = await fetch(url, config);
    console.log('[API Debug] Response meta', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorPreview = errorText.length > 1000 ? `${errorText.substring(0, 1000)}...(truncated)` : errorText;
      const parsedError = safeParseJson(errorPreview || 'empty') as any;
      console.error('[API Debug] Error response body', parsedError);

      const backendMessage = parsedError && typeof parsedError === 'object'
        ? (parsedError.message || parsedError.Message)
        : null;

      if (backendMessage) {
        throw new Error(String(backendMessage));
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[API Debug] Response body', data);
    console.log(`API Response [${endpoint}]:`, data);

    // Handle both lowercase 'success' and uppercase 'Success'
    const success = data.success || data.Success;
    const message = data.message || data.Message;
    const responseData = data.data || data.Data;
    
    console.log(`Parsed data [${endpoint}]:`, { success, message, responseData });
    
    if (success === false) {
      throw new Error(message || 'API request failed');
    }

    console.groupEnd();
    return responseData as T;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    console.groupEnd();
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    throw error;
  }
}

export const depositApi = {
  // Authentication - Unified login endpoint (API determines role from database)
  login: async (userId: string, password: string) => {
    try {
      // Use Next.js API route as proxy to avoid CORS issues
      const url = `/depositmanager/api/proxy/login`;
      console.log('Login attempt:', { url, userId });
      console.log('[API Debug] Proxy -> Backend mapping', {
        backendPath: '/api/auth/login',
        backendUrl: buildBackendUrl('/api/auth/login'),
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let backendMessage = '';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorJson = await response.clone().json();
            backendMessage = String(errorJson?.message || errorJson?.Message || '');
          } else {
            backendMessage = (await response.clone().text()).trim();
          }
        } catch {
          backendMessage = '';
        }

        const friendlyMessage = friendlyHttpErrorMessage(
          response.status,
          backendMessage || response.statusText || 'Login failed'
        );
        throw new Error(sanitizeLoginMessage(friendlyMessage));
      }
      
      const data = await response.json();
      console.log('Login response:', data);
      
      // Handle both lowercase and uppercase response properties
      const success = data.success || data.Success;
      const message = data.message || data.Message;
      const responseData = data.data || data.Data;
      
      if (!success) {
        throw new Error(message || 'Login failed');
      }
      
      // API returns: { userId, role, name, status, roleId }
      // For bank users, if backend doesn't return separate bankId, use userId
      const userIdFromResponse = responseData.userId || responseData.UserId;
      const roleFromResponse = responseData.role || responseData.Role;
      const bankIdFromResponse = responseData.bankId || responseData.BankId || responseData.BANK_ID || 
                     (roleFromResponse === 'bank' ? userIdFromResponse : undefined);
      const bankNameFromResponse = responseData.bankName || responseData.BankName || responseData.BANK_NAME;
      
      return {
        user: {
          id: userIdFromResponse,
          userId: userIdFromResponse,
          role: roleFromResponse, // Role determined by API from database
          roleId: responseData.roleId || responseData.RoleId, // 1=Commissioner, 2=Account, 3=Bank
          name: responseData.name || responseData.Name,
          email: userIdFromResponse + '@smkc.gov.in', // Generate email from userId
          status: responseData.status || responseData.Status,
          bankId: bankIdFromResponse, // Will be userId for bank role if backend doesn't provide separate bankId
          bankName: bankNameFromResponse
        },
        token: responseData.token || null
      };
    } catch (error: any) {
      // Invalid credentials are expected user-flow errors; avoid noisy console error logs.
      const rawMessage = String(error?.message || '');
      const isExpectedAuthFailure = /^http\s+401/i.test(rawMessage) || /unauthori[sz]ed|invalid credential|login failed/i.test(rawMessage);
      if (!isExpectedAuthFailure) {
        console.warn('Login warning:', error);
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to API server. Please check your connection.');
      }
      throw new Error(sanitizeLoginMessage(error.message || 'Unable to sign in right now. Please try again.'));
    }
  },

  // Requirements (proxy endpoints)
  getRequirements: async (role: 'bank' | 'account' | 'commissioner' = 'account', filters?: { status?: string; depositType?: string; fromDate?: string; toDate?: string }): Promise<DepositRequirement[]> => {
    const params = new URLSearchParams();
    params.append('role', role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.depositType) params.append('depositType', filters.depositType);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    
    const apiResponse = await apiCall<DepositRequirementAPI[]>(`/depositmanager/api/proxy/requirements?${params.toString()}`);
    // Map API response (UPPERCASE fields) to camelCase for frontend
    return apiResponse.map(mapRequirementFromAPI);
  },

  getRequirement: async (id: string, role: 'bank' | 'account' | 'commissioner' = 'account'): Promise<DepositRequirement> => {
    const apiResponse = await apiCall<RequirementDetailsAPI>(`/depositmanager/api/proxy/requirements/${id}?role=${role}`);
    
    // API returns { o_requirement: [...], o_quotes: [...] }
    // Extract the first (and only) requirement from the array
    if (!apiResponse.o_requirement || apiResponse.o_requirement.length === 0) {
      throw new Error('Requirement not found');
    }
    
    return mapRequirementFromAPI(apiResponse.o_requirement[0]);
  },

  createRequirement: async (data: Partial<DepositRequirement>): Promise<DepositRequirement> => {
    // Create endpoint expects camelCase (not UPPERCASE like GET responses)
    const apiResponse = await apiCall<DepositRequirementAPI>('/depositmanager/api/proxy/requirements/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Convert response back to camelCase
    return mapRequirementFromAPI(apiResponse);
  },

  updateRequirement: async (id: string, data: Partial<DepositRequirement>): Promise<DepositRequirement> => {
    return apiCall<DepositRequirement>(`/depositmanager/api/proxy/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  authorizeRequirement: async (id: string, commissionerId: string): Promise<DepositRequirement> => {
    return apiCall<DepositRequirement>(`/depositmanager/api/proxy/requirements/${id}/authorize`, {
      method: 'POST',
      body: JSON.stringify({ commissionerId }),
    });
  },

  finalizeRequirement: async (id: string, bankId: string): Promise<DepositRequirement> => {
    return apiCall<DepositRequirement>(`/depositmanager/api/proxy/requirements/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ bankId }),
    });
  },

  invalidateRequirement: async (id: string, invalidatedBy: string, invalidationReason: string): Promise<void> => {
    const response = await fetch(`/depositmanager/api/proxy/requirements/${id}/invalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalidatedBy, invalidationReason }),
    });
    if (response.status === 204 || response.ok) return;
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to invalidate requirement');
  },

  // Banks
  getBanks: async (): Promise<Bank[]> => {
    const apiResponse = await apiCall<BankAPI[]>('/depositmanager/api/proxy/banks');
    // Map API response (UPPERCASE fields) to camelCase for frontend
    return apiResponse.map(mapBankFromAPI);
  },

  getBank: async (id: string): Promise<Bank> => {
    return apiCall<Bank>(`/depositmanager/api/proxy/banks/${id}`);
  },

  createBank: async (data: Partial<Bank>): Promise<Bank> => {
    // Create endpoint expects camelCase (not UPPERCASE)
    const apiResponse = await apiCall<BankAPI>('/depositmanager/api/proxy/banks/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Map response back to camelCase
    return mapBankFromAPI(apiResponse);
  },

  // Quotes
  getQuotes: async (role: 'bank' | 'account' | 'commissioner' = 'account', requirementId?: string, bankId?: string): Promise<BankQuote[]> => {
    const params = new URLSearchParams();
    params.append('role', role);
    if (requirementId) params.append('requirementId', requirementId);
    if (bankId) params.append('bankId', bankId);

    const apiResponse = await apiCall<any[]>(`/depositmanager/api/proxy/quotes?${params.toString()}`);

    const mappedQuotes = (apiResponse || []).map((q: any) => {
      // Normalize keys to UPPERCASE to handle CamelCasePropertyNamesContractResolver
      // transformations (e.g. BANK_ID → banK_ID, INTEREST_RATE → interesT_RATE).
      const n: Record<string, any> = {};
      for (const [k, v] of Object.entries(q as Record<string, any>)) {
        n[k.toUpperCase()] = v;
      }
      const consentDocument: Record<string, any> = n.CONSENT_DOCUMENT || {};
      const rawInterestRate = n.INTEREST_RATE;
      const rawSubmittedAt = n.SUBMITTED_AT ?? n.SUBMITED_AT ?? '';
      const normalizedSubmittedAt = rawSubmittedAt == null ? '' : String(rawSubmittedAt);
      const rawConsentSize = n.CONSENT_FILE_SIZE ?? consentDocument.FILE_SIZE ?? null;

      return {
        id: n.ID ?? '',
        requirementId: n.REQUIREMENT_ID ?? '',
        schemeName: n.SCHEME_NAME,
        bankId: n.BANK_ID ?? '',
        bankName: n.BANK_NAME ?? '',
        interestRate: typeof rawInterestRate === 'string' ? parseFloat(rawInterestRate) : Number(rawInterestRate || 0),
        remarks: n.REMARKS,
        consentFileName: n.CONSENT_FILE_NAME ?? consentDocument.FILE_NAME,
        consentFileSize: rawConsentSize === null || rawConsentSize === '' ? null : Number(rawConsentSize),
        consentUploadedAt: n.CONSENT_UPLOADED_AT ?? consentDocument.UPLOADED_AT ?? null,
        submittedAt: normalizedSubmittedAt,
        rank: n.RANK ?? n.RANKING,
        ranking: n.RANK ?? n.RANKING,
        status: n.STATUS ?? 'submitted',
      } as BankQuote;
    });

    // Debug only: helps verify whether backend is sending dates and how they are mapped.
    console.groupCollapsed(`[Quotes Debug] role=${role} requirementId=${requirementId || 'all'} bankId=${bankId || 'all'}`);
    console.log('[Quotes Debug] Raw quote sample:', (apiResponse || [])[0] || null);
    const rawQuoteSample = (apiResponse || [])[0] || null;
    if (rawQuoteSample && typeof rawQuoteSample === 'object') {
      const dateLikeFields = Object.entries(rawQuoteSample as Record<string, unknown>)
        .filter(([key]) => /(submit|upload|date|time)/i.test(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, unknown>);
      console.log('[Quotes Debug] Date-like fields from raw quote:', dateLikeFields);
    }
    console.table(
      mappedQuotes.slice(0, 10).map((quote) => ({
        id: quote.id,
        requirementId: quote.requirementId,
        bankId: quote.bankId,
        submittedAt: quote.submittedAt || 'EMPTY',
        consentUploadedAt: quote.consentUploadedAt || 'EMPTY',
        consentFileSize: quote.consentFileSize,
      }))
    );
    console.groupEnd();

    return mappedQuotes;
  },

  submitQuote: async (data: SubmitQuotePayload): Promise<BankQuote> => {
    // Normalize consent document payload (strip data URL prefix, sanitize filename)
    const payload = { ...data } as SubmitQuotePayload & { consentDocument?: any };
    if (payload.consentDocument?.fileData) {
      let fileData: string = payload.consentDocument.fileData;
      const dataUrlMatch = /^data:[^;]+;base64,(.+)$/i.exec(fileData);
      if (dataUrlMatch) {
        fileData = dataUrlMatch[1];
      }
      payload.consentDocument.fileData = fileData;
      // Try to set fileSize if missing
      if (!payload.consentDocument.fileSize && typeof fileData === 'string') {
        try {
          const rawLen = Buffer.from(fileData, 'base64').length;
          payload.consentDocument.fileSize = rawLen;
        } catch {}
      }
      // Sanitize filename (remove URL encoding artifacts)
      if (payload.consentDocument.fileName) {
        try {
          payload.consentDocument.fileName = decodeURIComponent(payload.consentDocument.fileName);
        } catch {}
      }
      // Timestamp
      if (!payload.consentDocument.uploadedAt) {
        payload.consentDocument.uploadedAt = new Date().toISOString();
      }
    }
    // Ensure only Google Drive is used: strip base64/content fields and send only fileName
    if (payload.consentDocument) {
      payload.consentDocument = { fileName: payload.consentDocument.fileName } as any;
    }
    return apiCall<BankQuote>('/depositmanager/api/proxy/quotes/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Deprecated: consent download handled via `/depositmanager/api/proxy/consent/download`

  checkQuoteExists: async (requirementId: string, bankId: string): Promise<{ hasQuote: boolean; quoteId: string | null }> => {
    // Backend has no dedicated /quotes/check endpoint; filter the bank's quotes list instead
    try {
      const quotes = await apiCall<any[]>(
        `/depositmanager/api/proxy/quotes?role=bank&bankId=${encodeURIComponent(bankId)}&requirementId=${encodeURIComponent(requirementId)}`
      );
      // Backend already filters by requirementId, so any returned quote belongs to that requirement.
      // Normalize keys to handle CamelCasePropertyNamesContractResolver mixed-case output.
      const first = (quotes || [])[0] ?? null;
      const quoteId = first ? String((first as any).ID ?? (first as any).id ?? '') : null;
      return { hasQuote: (quotes || []).length > 0, quoteId };
    } catch {
      return { hasQuote: false, quoteId: null };
    }
  },

  // Dashboard Stats
  getDashboardStats: async (role: 'bank' | 'account' | 'commissioner', userId: string, bankId?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    params.append('role', role);
    if (bankId) params.append('bankId', bankId);

    // API returns: { Success, Data: [ { TOTAL_REQUIREMENTS, ... } ] }
    // Normalize keys to UPPERCASE to handle CamelCasePropertyNamesContractResolver.
    const raw = await apiCall<any>(`/depositmanager/api/proxy/dashboard?${params.toString()}`);
    const rawFirst = Array.isArray(raw) ? raw[0] : raw;
    const first: Record<string, any> = {};
    if (rawFirst && typeof rawFirst === 'object') {
      for (const [k, v] of Object.entries(rawFirst as Record<string, any>)) {
        first[k.toUpperCase()] = v;
      }
    }
    const mapped: DashboardStats = {
      totalRequirements: first.TOTAL_REQUIREMENTS ?? 0,
      activeRequirements: first.ACTIVE_REQUIREMENTS ?? 0,
      expiredRequirements: first.EXPIRED_REQUIREMENTS ?? 0,
      finalizedRequirements: first.FINALIZED_REQUIREMENTS ?? 0,
      totalBanks: first.TOTAL_BANKS ?? 0,
      activeBanks: first.ACTIVE_BANKS ?? 0,
      totalQuotes: first.TOTAL_QUOTES ?? 0,
      pendingAuthorizations: first.PENDING_AUTHORIZATIONS ?? 0,
      myQuotes: first.MY_QUOTES ?? undefined,
      selectedQuotes: first.SELECTED_QUOTES ?? undefined,
    };
    return mapped;
  },

  // Commissioner specific
  getPendingRequirements: async (): Promise<DepositRequirement[]> => {
    return apiCall<DepositRequirement[]>('/depositmanager/api/proxy/requirements?role=commissioner&status=pending');
  },

  getCommissionerRequirements: async (status?: string): Promise<DepositRequirement[]> => {
    const params = new URLSearchParams();
    params.append('role', 'commissioner');
    if (status) params.append('status', status);
    return apiCall<DepositRequirement[]>(`/depositmanager/api/proxy/requirements?${params.toString()}`);
  },

  getCommissionerRequirementDetails: async (id: string): Promise<{ requirement: DepositRequirement; quotes: BankQuote[] }> => {
    return apiCall<{ requirement: DepositRequirement; quotes: BankQuote[] }>(
      `/depositmanager/api/proxy/requirements/${id}?role=commissioner`
    );
  },

  getCommissionerQuotes: async (requirementId?: string): Promise<BankQuote[]> => {
    const params = new URLSearchParams();
    params.append('role', 'commissioner');
    if (requirementId) params.append('requirementId', requirementId);
    return apiCall<BankQuote[]>(`/depositmanager/api/proxy/quotes?${params.toString()}`);
  },

  getCommissionerEnhancedKpis: async () => {
    const raw = await apiCall<any>('/depositmanager/api/proxy/commissioner-dashboard?metric=enhanced-kpis');
    const first = Array.isArray(raw) ? raw[0] : raw;
    return {
      totalInvestedAmount: toNumber(first?.TOTAL_INVESTED_AMOUNT ?? first?.totalInvestedAmount),
      annualInterestIncome: toNumber(first?.ANNUAL_INTEREST_INCOME ?? first?.annualInterestIncome),
      finalizedDepositsCount: toNumber(first?.FINALIZED_DEPOSITS_COUNT ?? first?.finalizedDepositsCount),
      upcomingMaturities90Days: toNumber(first?.UPCOMING_MATURITIES_90_DAYS ?? first?.upcomingMaturities90Days),
      upcoming30Days: toNumber(first?.UPCOMING_30_DAYS ?? first?.upcoming30Days),
      upcoming60Days: toNumber(first?.UPCOMING_60_DAYS ?? first?.upcoming60Days),
      upcoming90Days: toNumber(first?.UPCOMING_90_DAYS ?? first?.upcoming90Days),
      pendingAuthorizations: toNumber(first?.PENDING_AUTHORIZATIONS ?? first?.pendingAuthorizations),
    };
  },

  getCommissionerBankWiseAnalytics: async () => {
    const raw = await apiCall<any[]>('/depositmanager/api/proxy/commissioner-dashboard?metric=bank-wise');
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((item) => ({
      bankId: String(item?.BANK_ID ?? item?.bankId ?? ''),
      bankName: String(item?.BANK_NAME ?? item?.bankName ?? 'Unknown Bank'),
      investedAmount: toNumber(item?.INVESTED_AMOUNT ?? item?.investedAmount),
      interestRate: toNumber(item?.INTEREST_RATE ?? item?.interestRate),
      interestIncome: toNumber(item?.INTEREST_INCOME ?? item?.interestIncome),
    }));
  },

  getCommissionerUpcomingMaturities: async (daysWindow: number = 90, bankId?: string) => {
    const params = new URLSearchParams();
    params.append('metric', 'upcoming-maturities');
    params.append('daysWindow', String(daysWindow));
    if (bankId) params.append('bankId', bankId);

    const raw = await apiCall<any[]>(`/depositmanager/api/proxy/commissioner-dashboard?${params.toString()}`);
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((item) => ({
      requirementId: String(item?.REQUIREMENT_ID ?? item?.requirementId ?? ''),
      schemeName: String(item?.SCHEME_NAME ?? item?.schemeName ?? 'Unknown Scheme'),
      bankId: String(item?.BANK_ID ?? item?.bankId ?? ''),
      bankName: String(item?.BANK_NAME ?? item?.bankName ?? 'Unknown Bank'),
      amount: toNumber(item?.AMOUNT ?? item?.amount),
      interestRate: toNumber(item?.INTEREST_RATE ?? item?.interestRate),
      depositPeriod: toNumber(item?.DEPOSIT_PERIOD ?? item?.depositPeriod),
      maturityDate: String(item?.MATURITY_DATE ?? item?.maturityDate ?? ''),
      daysLeft: toNumber(item?.DAYS_LEFT ?? item?.daysLeft),
    }));
  },

  getCommissionerDepositTypeDistribution: async () => {
    const raw = await apiCall<any[]>('/depositmanager/api/proxy/commissioner-dashboard?metric=deposit-type-distribution');
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((item) => ({
      depositType: String(item?.DEPOSIT_TYPE ?? item?.depositType ?? 'unknown'),
      totalAmount: toNumber(item?.TOTAL_AMOUNT ?? item?.totalAmount),
      depositCount: toNumber(item?.DEPOSIT_COUNT ?? item?.depositCount),
      percentageShare: toNumber(item?.PERCENTAGE_SHARE ?? item?.percentageShare),
    }));
  },

  getCommissionerInterestTimeline: async (monthsAhead: number = 12) => {
    const raw = await apiCall<any[]>(`/depositmanager/api/proxy/commissioner-dashboard?metric=timeline&monthsAhead=${monthsAhead}`);
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((item) => ({
      timelineMonth: String(item?.TIMELINE_MONTH ?? item?.timelineMonth ?? ''),
      timelineLabel: String(item?.TIMELINE_LABEL ?? item?.timelineLabel ?? ''),
      projectedInterestIncome: toNumber(item?.PROJECTED_INTEREST_INCOME ?? item?.projectedInterestIncome),
      maturingDepositsCount: toNumber(item?.MATURING_DEPOSITS_COUNT ?? item?.maturingDepositsCount),
    }));
  },

  getCommissionerPortfolioHealth: async (concentrationThreshold: number = 40, minHealthyRate: number = 7) => {
    const raw = await apiCall<any>(
      `/depositmanager/api/proxy/commissioner-dashboard?metric=portfolio-health&concentrationThreshold=${concentrationThreshold}&minHealthyRate=${minHealthyRate}`
    );
    const first = Array.isArray(raw) ? raw[0] : raw;
    return {
      healthScore: toNumber(first?.HEALTH_SCORE ?? first?.healthScore),
      diversificationScore: toNumber(first?.DIVERSIFICATION_SCORE ?? first?.diversificationScore),
      concentrationScore: toNumber(first?.CONCENTRATION_SCORE ?? first?.concentrationScore),
      maturitiesScore: toNumber(first?.MATURITIES_SCORE ?? first?.maturitiesScore),
      rateOptimizationScore: toNumber(first?.RATE_OPTIMIZATION_SCORE ?? first?.rateOptimizationScore),
      totalBanks: toNumber(first?.TOTAL_BANKS ?? first?.totalBanks),
      maxConcentrationPercent: toNumber(first?.MAX_CONCENTRATION_PERCENT ?? first?.maxConcentrationPercent),
      avgInterestRate: toNumber(first?.AVG_INTEREST_RATE ?? first?.avgInterestRate),
      nearestMaturityDays: toNumber(first?.NEAREST_MATURITY_DAYS ?? first?.nearestMaturityDays),
    };
  },

  // Bank specific
  getBankRequirements: async (status: string = 'published'): Promise<DepositRequirement[]> => {
    return apiCall<DepositRequirement[]>(`/depositmanager/api/proxy/requirements?role=bank&status=${status}`);
  },

  getBankRequirement: async (id: string): Promise<DepositRequirement> => {
    return apiCall<DepositRequirement>(`/depositmanager/api/proxy/requirements/${id}?role=bank`);
  },

  getBankQuotes: async (bankId: string, requirementId?: string): Promise<BankQuote[]> => {
    const params = new URLSearchParams();
    params.append('role', 'bank');
    params.append('bankId', bankId);
    if (requirementId) params.append('requirementId', requirementId);
    return apiCall<BankQuote[]>(`/depositmanager/api/proxy/quotes?${params.toString()}`);
  },

  getBankHistory: async (bankId: string): Promise<BankQuote[]> => {
    return apiCall<BankQuote[]>(`/depositmanager/api/proxy/quotes?role=bank&bankId=${bankId}`);
  },

  // Reports
  getAccountReports: async (filters?: { fromDate?: string; toDate?: string; status?: string }): Promise<any> => {
    const params = new URLSearchParams();
    params.append('role', 'account');
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.status) params.append('status', filters.status);
    return apiCall<any>(`/depositmanager/api/proxy/reports?${params.toString()}`);
  },

  getCommissionerReports: async (filters?: { fromDate?: string; toDate?: string; status?: string }): Promise<any> => {
    const params = new URLSearchParams();
    params.append('role', 'commissioner');
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.status) params.append('status', filters.status);
    return apiCall<any>(`/depositmanager/api/proxy/reports?${params.toString()}`);
  },

  getApprovalHistory: async (filters?: { fromDate?: string; toDate?: string }): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('role', 'commissioner');
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    return apiCall<any[]>(`/depositmanager/api/proxy/reports?${params.toString()}`);
  },

  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const profile = await apiCall<any>(`/depositmanager/api/proxy/profile?userId=${encodeURIComponent(userId)}`);
    return {
      userId: String(profile?.userId ?? profile?.UserId ?? profile?.USER_ID ?? ''),
      role: String(profile?.role ?? profile?.Role ?? profile?.ROLE ?? 'unknown') as UserProfile['role'],
      roleId: profile?.roleId ?? profile?.RoleId ?? profile?.ROLE_ID,
      name: String(profile?.name ?? profile?.Name ?? profile?.NAME ?? ''),
      status: profile?.status ?? profile?.Status ?? profile?.STATUS,
      bankId: firstMeaningfulValue(profile?.bankId, profile?.BankId, profile?.BANK_ID, profile?.BANKID, profile?.bankCode, profile?.BANK_CODE),
      bankName: firstMeaningfulValue(profile?.bankName, profile?.BankName, profile?.BANK_NAME, profile?.BANKNAME, profile?.nameOfBank, profile?.NAME_OF_BANK),
    };
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message?: string }> => {
    const response = await apiCall<any>('/depositmanager/api/proxy/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      success: true,
      message: response?.message || response?.Message,
    };
  },
};
