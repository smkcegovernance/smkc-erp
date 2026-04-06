'use client';

import { User } from './types';

const AUTH_STORAGE_KEY = 'smkc_deposit_auth';

export const authService = {
  // Login
  login: (userId: string, password: string): User | null => {
    // Mock authentication
    const mockUsers: Record<string, User> = {
      'ACCTDPT1': {
        id: 'acc-001',
        role: 'account',
        email: 'account@smkc.gov.in',
        name: 'Account Department'
      },
      'COMMSNR1': {
        id: 'comm-001',
        role: 'commissioner',
        email: 'commissioner@smkc.gov.in',
        name: 'Commissioner'
      },
      'BANKSBI1': {
        id: 'bank-001',
        role: 'bank',
        email: 'bank@sbi.com',
        name: 'State Bank of India',
        bankId: 'BNK-001'
      },
      'BANKHDFC': {
        id: 'bank-002',
        role: 'bank',
        email: 'bank@hdfc.com',
        name: 'HDFC Bank',
        bankId: 'BNK-002'
      },
      'BANKICIC': {
        id: 'bank-003',
        role: 'bank',
        email: 'bank@icici.com',
        name: 'ICICI Bank',
        bankId: 'BNK-003'
      }
    };

    // Simple password check (in real app, this would be server-side)
    if (password === 'Pass@123' && userId.length === 8 && password.length === 8) {
      const user = mockUsers[userId.toUpperCase()];
      if (user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        }
        return user;
      }
    }
    return null;
  },

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null;
  },

  // Check role
  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  }
};
