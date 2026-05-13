export type UserRole = 'commissioner' | 'hod' | 'account' | 'bank' | 'operator' | 'unknown'

export type DashboardViewKey = 'commissioner' | 'hod' | 'accounts' | 'operations'

export interface Department {
  key: string
  label: string
  route: string
  /** Bootstrap Icon class name (without the leading "bi ") */
  icon: string
  /** Primary accent colour (hex) */
  color: string
  /** Tinted background for icon box (rgba string) */
  colorBg: string
  /** One-line department description */
  description: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
  errorCode?: string
}

export class SmkcApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string = 'UNKNOWN_ERROR',
    public readonly detail?: string
  ) {
    super(message)
    this.name = 'SmkcApiError'
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface User {
  userId: string
  name: string
  role: UserRole
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
  {
    key: 'water-tax',
    label: 'Water Tax',
    route: '/water-tax',
    icon: 'bi-droplet-fill',
    color: '#0077B6',
    colorBg: 'rgba(0, 119, 182, 0.08)',
    description: 'Billing, connections & water supply management',
  },
  {
    key: 'accounts',
    label: 'Accounts',
    route: '/accounts',
    icon: 'bi-journal-bookmark-fill',
    color: '#2E7D32',
    colorBg: 'rgba(46, 125, 50, 0.08)',
    description: 'Municipal finance, budgets & expenditure',
  },
  {
    key: 'property-tax',
    label: 'Property Tax',
    route: '/property-tax',
    icon: 'bi-house-fill',
    color: '#E65100',
    colorBg: 'rgba(230, 81, 0, 0.08)',
    description: 'Property assessment, demand & collection',
  },
  {
    key: 'general-administration',
    label: 'General Administration',
    route: '/general-administration',
    icon: 'bi-building-fill',
    color: '#4A148C',
    colorBg: 'rgba(74, 20, 140, 0.08)',
    description: 'Administrative services & civic governance',
  },
  {
    key: 'marriage',
    label: 'Marriage',
    route: '/marriage',
    icon: 'bi-heart-fill',
    color: '#C2185B',
    colorBg: 'rgba(194, 24, 91, 0.08)',
    description: 'Marriage registrations & certificates',
  },
  {
    key: 'women-child-welfare',
    label: 'Women & Child Welfare',
    route: '/women-child-welfare',
    icon: 'bi-people-fill',
    color: '#00838F',
    colorBg: 'rgba(0, 131, 143, 0.08)',
    description: 'Welfare schemes for women & children',
  },
  {
    key: 'estate',
    label: 'Estate',
    route: '/estate',
    icon: 'bi-map-fill',
    color: '#5D4037',
    colorBg: 'rgba(93, 64, 55, 0.08)',
    description: 'Municipal properties, rentals & leases',
  },
  {
    key: 'market-licenses',
    label: 'Market Licenses',
    route: '/market-licenses',
    icon: 'bi-shop-window',
    color: '#F57F17',
    colorBg: 'rgba(245, 127, 23, 0.08)',
    description: 'Trade licenses, shops & establishments',
  },
  {
    key: 'fire',
    label: 'Fire Department',
    route: '/fire',
    icon: 'bi-fire',
    color: '#BF360C',
    colorBg: 'rgba(191, 54, 12, 0.08)',
    description: 'Fire prevention, NOCs & emergency services',
  },
  {
    key: 'health',
    label: 'Health Department',
    route: '/health',
    icon: 'bi-heart-pulse-fill',
    color: '#1B5E20',
    colorBg: 'rgba(27, 94, 32, 0.08)',
    description: 'Public health, sanitation & vital statistics',
  },
  {
    key: 'pwd',
    label: 'PWD',
    route: '/pwd',
    icon: 'bi-cone-striped',
    color: '#37474F',
    colorBg: 'rgba(55, 71, 79, 0.08)',
    description: 'Roads, infrastructure & civic works',
  },
  {
    key: 'pms',
    label: 'PMS',
    route: '/pms',
    icon: 'bi-wallet2',
    color: '#1565C0',
    colorBg: 'rgba(21, 101, 192, 0.08)',
    description: 'Payroll processing, salary & employee compensation',
  },
  {
    key: 'audit-department',
    label: 'Audit Department',
    route: '/audit-department',
    icon: 'bi-clipboard2-check-fill',
    color: '#7D5A00',
    colorBg: 'rgba(125, 90, 0, 0.08)',
    description: 'Internal audit, proposal review & approval flow',
  },
]

// ── Water Tax Dashboard Types ─────────────────────────────────────────────────

export interface PaymentMethodStat {
  method: string
  receipts: number
  amount: number
  pctShare: number
}

export interface WardRevenueStat {
  wardName: string
  connections: number
  demand: number
  collected: number
  balance: number
  efficiencyPct: number
}

export interface BillingCycleStat {
  cycleDesc: string
  billedCount: number
  demand: number
  paid: number
  balance: number
  meterRent?: number
  lateFees?: number
  isCurrentCycle: boolean
}

export interface MonthlyCollectionStat {
  monthYr: string
  sortKey: number
  receipts: number
  amount: number
}

export interface DefaulterStat {
  usageName: string
  pendingConns: number
  balanceAmt: number
  pctShare: number
}

export interface YearlyRevenueTrend {
  finYr: string
  demand: number
  collected: number
  balance: number
  efficiencyPct: number
  billedConnections: number
}

export interface LastYearBcStat {
  bcDesc: string
  billedCount: number
  demand: number
  collected: number
  balance: number
  efficiencyPct: number
}

export interface LastYearInsights {
  finYr: string
  totalDemand: number
  waterCharge: number
  meterRentBilled: number
  lateFeesBilled: number
  connectionsBilled: number
  totalCollected: number
  waterChargeCollected: number
  meterRentCollected: number
  lateFeesCollected: number
  collectionEfficiencyPct: number
  carriedForward: number
  connectionsCleared: number
  connectionsPending: number
  billingCycles: LastYearBcStat[]
  paymentMethods: PaymentMethodStat[]
}

export interface WaterRevenueDashboard {
  finYr: string
  currentCycleDesc: string
  currentCycleDemand: number
  currentCyclePaid: number
  currentCycleBalance: number
  currentCycleLateFees: number
  currentCycleLateFeesBalance: number
  currentCycleMeterRent: number
  currYrArrearDesc: string
  currYrArrearDemand: number
  currYrArrearPaid: number
  currYrArrearBalance: number
  prevYearsArrearBalance: number
  prevYearsArrearCollected: number
  totalOutstanding: number
  excessCreditBalance: number
  totalDemand: number
  totalCollected: number
  collectionEfficiencyPct: number
  todayCollection: number
  paymentMethods: PaymentMethodStat[]
  wardStats: WardRevenueStat[]
  billingCycles: BillingCycleStat[]
  monthlyTrend: MonthlyCollectionStat[]
  defaultersByUsage: DefaulterStat[]
  yearlyTrend: YearlyRevenueTrend[]
  lastYearInsights: LastYearInsights | null
}

export interface MeterStatusStat {
  msDesc: string
  count: number
  pctShare: number
}

export interface PipeSizeStat {
  pipeDescMm: string
  pipeDescInch: string
  total: number
  residential: number
  nonResidential: number
}

export interface WardConnectionStat {
  wardName: string
  total: number
  residential: number
  nonResidential: number
  metered: number
  permDisc: number
}

export interface NewConnectionYear {
  connYear: string
  total: number
  residential: number
  nonResidential: number
}

export interface UsageTypeConnStat {
  usageName: string
  count: number
  pctShare: number
}

export interface WaterConnectionDashboard {
  total: number
  activeConnected: number
  newPending: number
  permDisconnected: number
  tempDisconnected: number
  residential: number
  nonResidential: number
  trust: number
  others: number
  metered: number
  nonMetered: number
  smkcMeter: number
  privateMeter: number
  meterStatusBreakdown: MeterStatusStat[]
  pipeSizeBreakdown: PipeSizeStat[]
  wardStats: WardConnectionStat[]
  newConnectionTrend: NewConnectionYear[]
  usageTypeBreakdown: UsageTypeConnStat[]
}
