export interface Department {
  key: string
  label: string
  route: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
  errorCode?: string
}

export interface User {
  userId: string
  name: string
  role: 'commissioner' | 'account' | 'bank' | 'unknown'
  roleId: number
  status: string
  bankId?: string
  bankName?: string
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}

export const DEPARTMENTS: Department[] = [
  { key: 'water', label: 'Water', route: '/water' },
  { key: 'tax', label: 'Tax', route: '/tax' },
  { key: 'health', label: 'Health', route: '/health' },
  { key: 'accounts', label: 'Accounts', route: '/accounts' },
  {
    key: 'woman-child-walfare',
    label: 'Woman Child Walfare',
    route: '/woman-child-walfare',
  },
]
