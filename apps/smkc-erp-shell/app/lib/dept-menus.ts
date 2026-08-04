export interface MenuItem {
  key: string
  label: string
  icon: string
  /** Override the generated href (e.g. for cross-app navigation) */
  href?: string
  /** Open in a new tab */
  external?: boolean
}

export interface MenuGroup {
  key: 'transactions' | 'applications' | 'reports' | 'masters' | 'departmental-samaj' | 'departmental-workorders'
  label: string
  icon: string
  items: MenuItem[]
}

export type DeptMenuMap = Record<string, MenuGroup[]>

export const DEPT_MENUS: DeptMenuMap = {
  // No pages created yet — dashboard only
  'water-tax': [],

  'accounts': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'primary-budget-entry', label: 'Primary Budget Entry', icon: 'bi-journal-plus' },
        { key: 'final-budget-entry',   label: 'Final Budget Entry',   icon: 'bi-journal-check' },
        { key: 'budget-book-list',     label: 'Budget Book List',     icon: 'bi-list-columns-reverse' },
        { key: 'budget-cap',           label: 'Budget Cap Settings',  icon: 'bi-shield-lock-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'deposit-manager', label: 'Deposit Manager', icon: 'bi-safe2-fill', href: 'http://localhost:3000/depositmanager', external: true },
        { key: 'work-proposal-remarks', label: 'Work Proposal — Account Remarks', icon: 'bi-calculator-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'budget-liability-report', label: 'Budget Liability Report',  icon: 'bi-file-earmark-bar-graph-fill' },
        { key: 'fund-wise-budget-liability-report', label: 'Fund-wise Budget Liability Report', icon: 'bi-diagram-3-fill' },
        { key: 'ward-wise-expenditure-report', label: 'Ward-wise Expenditure Report', icon: 'bi-buildings-fill' },
        { key: 'bill-payment-report',     label: 'Bill Payment Report',      icon: 'bi-receipt-cutoff' },
      ],
    },
  ],

  // No pages created yet — dashboard only
  'property-tax': [],

  'general-administration': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'work-proposal-under-10l', label: 'Quotation Proposal (Under ₹1 Lakh)', icon: 'bi-file-earmark-plus-fill' },
        { key: 'work-proposal-over-10l',  label: 'Tender Proposal (Over ₹1 Lakh)',    icon: 'bi-file-earmark-arrow-up-fill' },
        { key: 'work-proposal-other',     label: 'Other Proposal',                     icon: 'bi-file-earmark-diff-fill' },
        { key: 'work-proposals',          label: 'My Proposals',                       icon: 'bi-journal-text' },
      ],
    },
    {
      key: 'departmental-samaj', label: 'Departmental Samaj', icon: 'bi-file-earmark-ruled-fill',
      items: [
        { key: 'create-samaj',  label: 'Create New Samaj',      icon: 'bi-plus-circle-fill' },
        { key: 'samaj-list',    label: 'View Generated Samaj',  icon: 'bi-list-ul' },
      ],
    },
    {
      key: 'departmental-workorders', label: 'Departmental Workorders', icon: 'bi-clipboard-check-fill',
      items: [
        { key: 'create-work-order', label: 'Create New Work Order',     icon: 'bi-plus-circle-fill' },
        { key: 'work-order-list',   label: 'View Generated Work Orders', icon: 'bi-list-ul' },
      ],
    },
  ],

  // No pages created yet — dashboard only
  'marriage': [],

  'audit-department': [
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'work-proposal-remarks', label: 'Work Proposal — Audit Remarks', icon: 'bi-clipboard2-check-fill' },
      ],
    },
  ],

  'women-child-welfare': [
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'disability-registration', label: 'Disability Registration', icon: 'bi-person-hearts' },
        { key: 'single-women-registration', label: 'Single Women Registration', icon: 'bi-person-plus-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'registrations', label: 'Disability Registration Management', icon: 'bi-clipboard2-data-fill' },
      ],
    },
  ],

  // No pages created yet — dashboard only
  'estate': [],

  // No pages created yet — dashboard only
  'market-licenses': [],

  // No pages created yet — dashboard only
  'fire': [],

  // No pages created yet — dashboard only
  'health': [],

  // No pages created yet — dashboard only
  'pwd': [],

  // No pages created yet — dashboard only
  'pms': [],
}
