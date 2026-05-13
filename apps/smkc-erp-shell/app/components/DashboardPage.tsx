'use client'

import Link from 'next/link'
import { useState } from 'react'
import { currentUser } from '@smkc/auth'
import { DEPARTMENTS } from '@smkc/types'
import type { DashboardViewKey, UserRole } from '@smkc/types'
import DeptSidebar from './DeptSidebar'
import { useLanguage } from '../lib/i18n/LanguageContext'

// ── View definitions ──────────────────────────────────────────────────────────

interface ViewDef {
  key: DashboardViewKey
  label: string
  icon: string
}

const VIEW_DEFS: ViewDef[] = [
  { key: 'commissioner', label: 'Commissioner View', icon: 'bi-award-fill' },
  { key: 'hod',          label: 'Department View',   icon: 'bi-diagram-3-fill' },
  { key: 'accounts',     label: 'Accounts View',     icon: 'bi-bank2' },
  { key: 'operations',   label: 'Operations View',   icon: 'bi-gear-fill' },
]

/** Views accessible per role — roles with broader access see more tabs */
const ROLE_VIEWS: Record<string, DashboardViewKey[]> = {
  commissioner: ['commissioner', 'hod', 'accounts', 'operations'],
  hod:          ['hod', 'accounts', 'operations'],
  account:      ['accounts', 'operations'],
  operator:     ['operations'],
  bank:         ['accounts'],
  unknown:      ['commissioner', 'hod', 'accounts', 'operations'], // all views for dev/testing
}

// ── Stat item type ────────────────────────────────────────────────────────────

interface StatItem {
  value: string
  label: string
  icon: string
  color: string
  trend: 'up' | 'down' | 'neutral'
  trendValue?: string
}

// ── Table column config ───────────────────────────────────────────────────────

interface TableColumn {
  label: string
  width?: string
}

const VIEW_TABLE_COLUMNS: Record<DashboardViewKey, TableColumn[]> = {
  commissioner: [
    { label: 'Department / Zone', width: '25%' },
    { label: 'Demand (₹)',        width: '18%' },
    { label: 'Collection (₹)',    width: '18%' },
    { label: '% Achieved',        width: '13%' },
    { label: 'Status',            width: '13%' },
    { label: 'Action',            width: '13%' },
  ],
  hod: [
    { label: 'Application No.', width: '20%' },
    { label: 'Applicant Name',  width: '27%' },
    { label: 'Date',            width: '14%' },
    { label: 'Type',            width: '14%' },
    { label: 'Status',          width: '12%' },
    { label: 'Action',          width: '13%' },
  ],
  accounts: [
    { label: 'Receipt No.',  width: '18%' },
    { label: 'Name',         width: '27%' },
    { label: 'Amount (₹)',   width: '18%' },
    { label: 'Mode',         width: '15%' },
    { label: 'Date',         width: '12%' },
    { label: 'Action',       width: '10%' },
  ],
  operations: [
    { label: 'Task ID',      width: '14%' },
    { label: 'Description',  width: '30%' },
    { label: 'Assigned To',  width: '20%' },
    { label: 'Due Date',     width: '15%' },
    { label: 'Status',       width: '11%' },
    { label: 'Action',       width: '10%' },
  ],
}

// ── Generic KPI stats — shown for departments without specific overrides ──────

const GENERIC_STATS: Record<DashboardViewKey, StatItem[]> = {
  commissioner: [
    { value: '₹1.8 Cr', label: 'Revenue (Year to Date)',    icon: 'bi-currency-rupee',      color: '#2E7D32', trend: 'up',      trendValue: '+8.2%'  },
    { value: '4,521',   label: 'Active Records',            icon: 'bi-folder-fill',         color: '#0077B6', trend: 'neutral'                       },
    { value: '234',     label: 'Pending Approvals',         icon: 'bi-hourglass-split',     color: '#F57F17', trend: 'down',    trendValue: '-12'    },
    { value: '97.3%',   label: 'Overall Compliance',        icon: 'bi-graph-up-arrow',      color: '#2E7D32', trend: 'up',      trendValue: '+1.2%'  },
  ],
  hod: [
    { value: '1,234', label: 'Applications This Month',   icon: 'bi-file-earmark-text-fill',  color: '#0077B6', trend: 'up',   trendValue: '+89'  },
    { value: '89',    label: 'Pending Processing',        icon: 'bi-hourglass-split',          color: '#F57F17', trend: 'down', trendValue: '-23'  },
    { value: '45',    label: 'Open Complaints',           icon: 'bi-exclamation-circle-fill',  color: '#E65100', trend: 'down', trendValue: '-8'   },
    { value: '12',    label: 'Reports Overdue',           icon: 'bi-clipboard-data-fill',      color: '#4A148C', trend: 'neutral'                   },
  ],
  accounts: [
    { value: '₹12.4 L', label: "Today's Collections",    icon: 'bi-cash-stack',               color: '#2E7D32', trend: 'up',   trendValue: '+₹0.8L' },
    { value: '₹2.1 Cr', label: 'Outstanding Dues',       icon: 'bi-exclamation-triangle-fill', color: '#E65100', trend: 'down', trendValue: '-3.2%'  },
    { value: '₹5.6 L',  label: 'Budget Remaining',       icon: 'bi-piggy-bank-fill',           color: '#0077B6', trend: 'neutral'                    },
    { value: '98.1%',   label: 'Collection Efficiency',  icon: 'bi-percent',                   color: '#2E7D32', trend: 'up',   trendValue: '+0.8%'  },
  ],
  operations: [
    { value: '567', label: 'Total Tasks Today', icon: 'bi-list-task',      color: '#0077B6', trend: 'up',   trendValue: '+34' },
    { value: '234', label: 'Completed',         icon: 'bi-check2-circle',  color: '#2E7D32', trend: 'up',   trendValue: '41%' },
    { value: '89',  label: 'In Progress',       icon: 'bi-arrow-repeat',   color: '#F57F17', trend: 'neutral'                  },
    { value: '23',  label: 'Overdue',           icon: 'bi-alarm-fill',     color: '#E65100', trend: 'down', trendValue: '-5'  },
  ],
}

// ── Department-specific KPI overrides ─────────────────────────────────────────

const DEPT_STATS: Partial<Record<string, Record<DashboardViewKey, StatItem[]>>> = {
  'water-tax': {
    commissioner: [
      { value: '₹2.34 Cr', label: 'Revenue (Year to Date)',  icon: 'bi-currency-rupee',    color: '#0077B6', trend: 'up',   trendValue: '+12.4%' },
      { value: '45,230',   label: 'Active Connections',      icon: 'bi-droplet-fill',      color: '#0077B6', trend: 'up',   trendValue: '+234'   },
      { value: '8,412',    label: 'Bills Outstanding',       icon: 'bi-receipt',           color: '#E65100', trend: 'down', trendValue: '-5.2%'  },
      { value: '94.1%',    label: 'Collection Efficiency',   icon: 'bi-graph-up-arrow',    color: '#2E7D32', trend: 'up',   trendValue: '+1.3%'  },
    ],
    hod: [
      { value: '312',   label: 'New Connections (Month)', icon: 'bi-plus-circle-fill',       color: '#0077B6', trend: 'up',   trendValue: '+28' },
      { value: '156',   label: 'Pending Applications',    icon: 'bi-hourglass-split',        color: '#F57F17', trend: 'down', trendValue: '-14' },
      { value: '48',    label: 'Complaints Open',         icon: 'bi-exclamation-circle-fill',color: '#E65100', trend: 'down', trendValue: '-6'  },
      { value: '98.4%', label: 'Water Supply Uptime',     icon: 'bi-activity',               color: '#2E7D32', trend: 'neutral'                 },
    ],
    accounts: [
      { value: '₹18.7 L', label: "Today's Collections", icon: 'bi-cash-stack',               color: '#2E7D32', trend: 'up',   trendValue: '+₹1.2L' },
      { value: '₹4.23 Cr',label: 'Total Arrears',       icon: 'bi-exclamation-triangle-fill', color: '#E65100', trend: 'down', trendValue: '-2.1%'  },
      { value: '₹42.1 L', label: 'Month Collections',   icon: 'bi-bank2',                    color: '#0077B6', trend: 'up',   trendValue: '+8.3%'  },
      { value: '12',       label: 'Refunds Pending',     icon: 'bi-arrow-counterclockwise',   color: '#F57F17', trend: 'neutral'                    },
    ],
    operations: [
      { value: '1,234', label: 'Bills Generated Today',  icon: 'bi-file-earmark-text-fill', color: '#0077B6', trend: 'up',   trendValue: '+45' },
      { value: '89',    label: 'Meter Readings Due',     icon: 'bi-speedometer2',            color: '#F57F17', trend: 'down', trendValue: '-12' },
      { value: '23',    label: 'Disconnections Today',   icon: 'bi-x-circle-fill',           color: '#E65100', trend: 'neutral'                  },
      { value: '67',    label: 'Reconnections Done',     icon: 'bi-check-circle-fill',       color: '#2E7D32', trend: 'up',   trendValue: '+5'  },
    ],
  },

  'property-tax': {
    commissioner: [
      { value: '₹8.92 Cr',  label: 'Annual Demand',          icon: 'bi-currency-rupee',         color: '#E65100', trend: 'up',   trendValue: '+15.1%' },
      { value: '1,12,450',  label: 'Assessable Properties',   icon: 'bi-house-fill',             color: '#E65100', trend: 'up',   trendValue: '+1,234' },
      { value: '24,312',    label: 'Defaulters',              icon: 'bi-exclamation-triangle-fill',color:'#C2185B', trend: 'down', trendValue: '-892'   },
      { value: '88.4%',     label: 'Collection Percentage',   icon: 'bi-graph-up-arrow',         color: '#2E7D32', trend: 'up',   trendValue: '+2.1%'  },
    ],
    hod: [
      { value: '456', label: 'Assessments This Month',  icon: 'bi-file-earmark-check-fill', color: '#E65100', trend: 'up',   trendValue: '+67'  },
      { value: '234', label: 'Mutations Pending',       icon: 'bi-arrow-repeat',            color: '#F57F17', trend: 'down', trendValue: '-45'  },
      { value: '89',  label: 'Appeals Filed',           icon: 'bi-chat-square-text-fill',   color: '#4A148C', trend: 'neutral'                   },
      { value: '1,234',label: 'Notices Issued',         icon: 'bi-envelope-fill',           color: '#E65100', trend: 'up',   trendValue: '+123' },
    ],
    accounts: [
      { value: '₹34.5 L', label: "Today's Collections", icon: 'bi-cash-stack',               color: '#2E7D32', trend: 'up',   trendValue: '+₹3.2L' },
      { value: '₹1.07 Cr',label: 'Annual Arrears',      icon: 'bi-exclamation-triangle-fill', color: '#E65100', trend: 'down', trendValue: '-4.3%'  },
      { value: '₹1.23 Cr',label: 'Month Collections',   icon: 'bi-bank2',                    color: '#0077B6', trend: 'up',   trendValue: '+11.2%' },
      { value: '234',      label: 'Refunds Pending',     icon: 'bi-arrow-counterclockwise',   color: '#F57F17', trend: 'neutral'                    },
    ],
    operations: [
      { value: '892', label: 'Demands Generated',    icon: 'bi-file-earmark-text-fill', color: '#E65100', trend: 'up',   trendValue: '+78' },
      { value: '345', label: 'Site Inspections Due', icon: 'bi-geo-alt-fill',            color: '#F57F17', trend: 'down', trendValue: '-23' },
      { value: '67',  label: 'Name Transfers Today', icon: 'bi-person-fill',             color: '#0077B6', trend: 'neutral'                  },
      { value: '123', label: 'Objections Resolved',  icon: 'bi-check2-all',              color: '#2E7D32', trend: 'up',   trendValue: '+18' },
    ],
  },

  'audit-department': {
    commissioner: [
      { value: '₹42.7 Cr', label: 'Annual Budget',          icon: 'bi-currency-rupee',        color: '#7D5A00', trend: 'up',     trendValue: '+5.2%' },
      { value: '89',        label: 'Proposals Reviewed',     icon: 'bi-clipboard2-check-fill', color: '#7D5A00', trend: 'up',     trendValue: '+12'   },
      { value: '14',        label: 'Pending Review',         icon: 'bi-hourglass-split',       color: '#F57F17', trend: 'down',   trendValue: '-3'    },
      { value: '97.8%',     label: 'Overall Compliance',     icon: 'bi-graph-up-arrow',        color: '#2E7D32', trend: 'up',     trendValue: '+1.1%' },
    ],
    hod: [
      { value: '123', label: 'Proposals This Month', icon: 'bi-file-earmark-text-fill',  color: '#7D5A00', trend: 'up',   trendValue: '+18' },
      { value: '14',  label: 'Pending Review',       icon: 'bi-hourglass-split',         color: '#F57F17', trend: 'down', trendValue: '-5'  },
      { value: '6',   label: 'Objections Raised',    icon: 'bi-exclamation-circle-fill', color: '#E65100', trend: 'down', trendValue: '-2'  },
      { value: '103', label: 'Approved This Month',  icon: 'bi-check2-circle',           color: '#2E7D32', trend: 'up',   trendValue: '+15' },
    ],
    accounts: [
      { value: '₹38.1 Cr', label: 'Revenue Collected',  icon: 'bi-graph-up-arrow',        color: '#7D5A00', trend: 'up',   trendValue: '89.2%' },
      { value: '₹4.6 Cr',  label: 'Expenditure Pending',icon: 'bi-hourglass-split',       color: '#F57F17', trend: 'down', trendValue: '-₹0.3 Cr' },
      { value: '14',        label: 'Audit Observations', icon: 'bi-clipboard-check-fill',  color: '#7D5A00', trend: 'down', trendValue: '-3' },
      { value: '₹42.7 Cr', label: 'Annual Budget',       icon: 'bi-currency-rupee',        color: '#2E7D32', trend: 'up',   trendValue: '+5.2%' },
    ],
    operations: [
      { value: '103', label: 'Proposals Approved', icon: 'bi-clipboard2-check-fill', color: '#7D5A00', trend: 'up',   trendValue: '+15' },
      { value: '14',  label: 'Pending Processing', icon: 'bi-arrow-repeat',          color: '#F57F17', trend: 'down', trendValue: '-5'  },
      { value: '6',   label: 'Objections Raised',  icon: 'bi-exclamation-circle-fill',color: '#E65100', trend: 'down', trendValue: '-2'  },
      { value: '3',   label: 'Reports Overdue',    icon: 'bi-alarm-fill',            color: '#BF360C', trend: 'neutral'                   },
    ],
  },

  accounts: {
    commissioner: [
      { value: '₹42.7 Cr', label: 'Annual Budget',          icon: 'bi-currency-rupee',     color: '#2E7D32', trend: 'up',   trendValue: '+5.2%'    },
      { value: '₹38.1 Cr', label: 'Revenue Collected',      icon: 'bi-graph-up-arrow',     color: '#2E7D32', trend: 'up',   trendValue: '89.2%'    },
      { value: '₹4.6 Cr',  label: 'Expenditure Pending',    icon: 'bi-hourglass-split',    color: '#F57F17', trend: 'down', trendValue: '-₹0.3 Cr' },
      { value: '14',        label: 'Audit Observations',    icon: 'bi-clipboard-check-fill',color:'#4A148C', trend: 'down', trendValue: '-3'       },
    ],
    hod: [
      { value: '234', label: 'Vouchers This Month',       icon: 'bi-receipt',              color: '#2E7D32', trend: 'up',   trendValue: '+45' },
      { value: '89',  label: 'Bills for Payment',         icon: 'bi-file-earmark-text-fill',color: '#F57F17', trend: 'down', trendValue: '-12' },
      { value: '12',  label: 'Advances Outstanding',      icon: 'bi-person-fill',          color: '#E65100', trend: 'neutral'                  },
      { value: '5',   label: 'Bank Reconciliations Due',  icon: 'bi-bank2',                color: '#4A148C', trend: 'neutral'                  },
    ],
    accounts: [
      { value: '₹89.4 L', label: "Today's Total Credits", icon: 'bi-cash-stack',             color: '#2E7D32', trend: 'up',   trendValue: '+₹5.6L' },
      { value: '₹45.2 L', label: "Today's Total Debits",  icon: 'bi-arrow-down-circle-fill', color: '#E65100', trend: 'neutral'                    },
      { value: '17',       label: 'Pending Approvals',    icon: 'bi-hourglass-split',        color: '#F57F17', trend: 'down', trendValue: '-4'     },
      { value: '₹3.2 Cr', label: 'Cash Book Balance',     icon: 'bi-bank2',                  color: '#2E7D32', trend: 'neutral'                    },
    ],
    operations: [
      { value: '456', label: 'Transactions Today',   icon: 'bi-list-task',             color: '#2E7D32', trend: 'up',   trendValue: '+67' },
      { value: '234', label: 'Entries Verified',     icon: 'bi-check2-circle',         color: '#0077B6', trend: 'up',   trendValue: '+45' },
      { value: '23',  label: 'Discrepancies Found',  icon: 'bi-exclamation-circle-fill',color: '#E65100', trend: 'down', trendValue: '-8'  },
      { value: '8',   label: 'Journals Pending Post',icon: 'bi-journal-text',          color: '#F57F17', trend: 'neutral'                   },
    ],
  },

  health: {
    commissioner: [
      { value: '1,23,456', label: 'Birth Registrations (YTD)',    icon: 'bi-person-fill-add',    color: '#1B5E20', trend: 'up',   trendValue: '+1,234' },
      { value: '8,921',    label: 'Death Registrations (YTD)',    icon: 'bi-clipboard-data-fill', color:'#4A148C', trend: 'neutral'                    },
      { value: '234',      label: 'Sanitation Complaints Open',   icon: 'bi-exclamation-circle-fill',color:'#E65100',trend:'down',trendValue:'-45'     },
      { value: '98.2%',    label: 'Vaccination Coverage',        icon: 'bi-shield-fill-check',   color: '#1B5E20', trend: 'up',   trendValue: '+0.8%'  },
    ],
    hod: [
      { value: '567',  label: 'Health Cards Issued (Month)', icon: 'bi-card-heading',           color: '#1B5E20', trend: 'up',   trendValue: '+89' },
      { value: '89',   label: 'Pending Registrations',      icon: 'bi-hourglass-split',        color: '#F57F17', trend: 'down', trendValue: '-23' },
      { value: '45',   label: 'Active Vaccination Camps',   icon: 'bi-activity',               color: '#1B5E20', trend: 'up',   trendValue: '+5'  },
      { value: '234',  label: 'FSSAI Inspections Done',     icon: 'bi-search',                 color: '#0077B6', trend: 'neutral'                  },
    ],
    accounts: [
      { value: '₹8.9 L',  label: 'Fee Collections (Month)', icon: 'bi-cash-stack',     color: '#1B5E20', trend: 'up',   trendValue: '+₹0.6L' },
      { value: '₹23.4 L', label: 'Grants Received (YTD)',   icon: 'bi-bank2',          color: '#0077B6', trend: 'neutral'                    },
      { value: '₹4.5 L',  label: 'Budget Spent (Month)',    icon: 'bi-piggy-bank-fill', color: '#F57F17', trend: 'neutral'                   },
      { value: '12',       label: 'Pending Bills',          icon: 'bi-receipt',        color: '#E65100', trend: 'down', trendValue: '-3'     },
    ],
    operations: [
      { value: '345', label: 'Certificates Issued Today', icon: 'bi-file-earmark-check-fill', color: '#1B5E20', trend: 'up',   trendValue: '+34' },
      { value: '89',  label: 'Food Stalls Inspected',     icon: 'bi-shop-window',             color: '#0077B6', trend: 'neutral'                  },
      { value: '23',  label: 'Health Notices Issued',     icon: 'bi-envelope-fill',           color: '#E65100', trend: 'up',   trendValue: '+5'  },
      { value: '456', label: 'Births Registered Today',   icon: 'bi-person-fill-add',         color: '#1B5E20', trend: 'up',   trendValue: '+45' },
    ],
  },

  fire: {
    commissioner: [
      { value: '234',   label: 'NOCs Issued (YTD)',         icon: 'bi-shield-fill-check',       color: '#BF360C', trend: 'up',   trendValue: '+45'  },
      { value: '12',    label: 'Incidents This Month',      icon: 'bi-fire',                    color: '#C2185B', trend: 'down', trendValue: '-3'   },
      { value: '98.7%', label: 'Response Rate < 15 min',   icon: 'bi-clock-fill',              color: '#2E7D32', trend: 'up',   trendValue: '+0.5%'},
      { value: '45',    label: 'Inspections Pending',       icon: 'bi-eye-fill',                color: '#F57F17', trend: 'down', trendValue: '-12'  },
    ],
    hod: [
      { value: '89',  label: 'NOC Applications (Month)', icon: 'bi-file-earmark-text-fill',    color: '#BF360C', trend: 'up',   trendValue: '+12' },
      { value: '34',  label: 'Renewals Due',             icon: 'bi-arrow-repeat',              color: '#F57F17', trend: 'neutral'                  },
      { value: '5',   label: 'Active Incidents',         icon: 'bi-exclamation-triangle-fill', color: '#E65100', trend: 'down', trendValue: '-2'  },
      { value: '12',  label: 'Drills Scheduled',         icon: 'bi-calendar-event-fill',       color: '#0077B6', trend: 'neutral'                  },
    ],
    accounts: [
      { value: '₹3.4 L',  label: 'NOC Fee Collections',    icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹0.3L' },
      { value: '₹12.3 L', label: 'Monthly Budget Used',    icon: 'bi-piggy-bank-fill', color: '#F57F17', trend: 'neutral'                   },
      { value: '45',       label: 'Pending Fee Payments',  icon: 'bi-hourglass-split', color: '#E65100', trend: 'down', trendValue: '-8'    },
      { value: '₹2.1 L',  label: 'Fine Collections (Month)',icon:'bi-bank2',           color: '#2E7D32', trend: 'up',   trendValue: '+₹0.2L'},
    ],
    operations: [
      { value: '23', label: 'Inspections Today',    icon: 'bi-eye-fill',         color: '#BF360C', trend: 'up',   trendValue: '+5' },
      { value: '8',  label: 'NOCs Approved Today',  icon: 'bi-check2-circle',   color: '#2E7D32', trend: 'neutral'                  },
      { value: '3',  label: 'Fire Calls Today',     icon: 'bi-telephone-fill',  color: '#E65100', trend: 'neutral'                  },
      { value: '15', label: 'Vehicles Operational', icon: 'bi-truck-front-fill',color: '#0077B6', trend: 'neutral'                  },
    ],
  },

  marriage: {
    commissioner: [
      { value: '3,456',  label: 'Registrations (YTD)',        icon: 'bi-heart-fill',          color: '#C2185B', trend: 'up',   trendValue: '+234' },
      { value: '1,234',  label: 'Certificates Issued (YTD)',  icon: 'bi-file-earmark-check-fill',color:'#C2185B',trend:'up',  trendValue: '+89'  },
      { value: '89',     label: 'Pending Registrations',      icon: 'bi-hourglass-split',     color: '#F57F17', trend: 'down', trendValue: '-15'  },
      { value: '98.2%',  label: 'Processing Rate',            icon: 'bi-graph-up-arrow',      color: '#2E7D32', trend: 'up',   trendValue: '+0.7%'},
    ],
    hod: [
      { value: '456', label: 'Applications This Month',  icon: 'bi-file-earmark-text-fill', color: '#C2185B', trend: 'up',   trendValue: '+45' },
      { value: '89',  label: 'Pending Verification',     icon: 'bi-search',                 color: '#F57F17', trend: 'down', trendValue: '-18' },
      { value: '34',  label: 'Corrections Requested',    icon: 'bi-pencil-fill',            color: '#E65100', trend: 'neutral'                  },
      { value: '12',  label: 'Correction Orders',        icon: 'bi-arrow-repeat',           color: '#4A148C', trend: 'neutral'                  },
    ],
    accounts: [
      { value: '₹4.5 L',  label: 'Fee Collections (Month)', icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹0.4L' },
      { value: '₹12.1 L', label: 'Revenue (YTD)',           icon: 'bi-bank2',          color: '#C2185B', trend: 'up',   trendValue: '+₹1.2L' },
      { value: '23',       label: 'Refunds Pending',        icon: 'bi-arrow-counterclockwise',color:'#F57F17',trend:'neutral'                 },
      { value: '₹2.3 L',  label: 'Budget Remaining',       icon: 'bi-piggy-bank-fill', color: '#0077B6', trend: 'neutral'                   },
    ],
    operations: [
      { value: '89',  label: 'Registrations Today',    icon: 'bi-heart-fill',              color: '#C2185B', trend: 'up',   trendValue: '+12' },
      { value: '56',  label: 'Certificates Issued',    icon: 'bi-file-earmark-check-fill', color: '#2E7D32', trend: 'up',   trendValue: '+8'  },
      { value: '23',  label: 'Pending Scrutiny',       icon: 'bi-eye-fill',                color: '#F57F17', trend: 'neutral'                  },
      { value: '5',   label: 'Objections Filed',       icon: 'bi-exclamation-circle-fill', color: '#E65100', trend: 'neutral'                  },
    ],
  },

  'women-child-welfare': {
    commissioner: [
      { value: '12,345', label: 'Beneficiaries (Active)',   icon: 'bi-people-fill',        color: '#00838F', trend: 'up',   trendValue: '+678' },
      { value: '45',     label: 'Active Schemes',           icon: 'bi-award-fill',         color: '#00838F', trend: 'up',   trendValue: '+3'   },
      { value: '₹3.2 Cr',label: 'Disbursements (YTD)',     icon: 'bi-currency-rupee',     color: '#2E7D32', trend: 'up',   trendValue: '+12%' },
      { value: '234',    label: 'Pending Applications',     icon: 'bi-hourglass-split',    color: '#F57F17', trend: 'down', trendValue: '-45'  },
    ],
    hod: [
      { value: '567', label: 'Applications This Month',  icon: 'bi-file-earmark-text-fill', color: '#00838F', trend: 'up',   trendValue: '+89' },
      { value: '234', label: 'Pending Review',           icon: 'bi-eye-fill',               color: '#F57F17', trend: 'down', trendValue: '-34' },
      { value: '45',  label: 'Active Anganwadis',        icon: 'bi-building-fill',          color: '#00838F', trend: 'neutral'                  },
      { value: '12',  label: 'Camp Programmes (Month)',  icon: 'bi-calendar-event-fill',    color: '#0077B6', trend: 'up',   trendValue: '+2'  },
    ],
    accounts: [
      { value: '₹8.7 L',  label: 'Disbursements Today',    icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹0.5L' },
      { value: '₹1.2 Cr', label: 'Government Grants (YTD)',icon: 'bi-bank2',          color: '#0077B6', trend: 'up',   trendValue: '+8.3%'  },
      { value: '₹4.3 L',  label: 'Budget Remaining',       icon: 'bi-piggy-bank-fill', color: '#00838F', trend: 'neutral'                   },
      { value: '34',       label: 'Pending Disbursements',  icon: 'bi-hourglass-split', color: '#F57F17', trend: 'down', trendValue: '-8'    },
    ],
    operations: [
      { value: '234', label: 'Beneficiaries Served Today', icon: 'bi-people-fill',            color: '#00838F', trend: 'up',   trendValue: '+34' },
      { value: '89',  label: 'Forms Processed',            icon: 'bi-file-earmark-check-fill',color: '#2E7D32', trend: 'up',   trendValue: '+12' },
      { value: '45',  label: 'Home Visits Done',           icon: 'bi-house-fill',             color: '#0077B6', trend: 'neutral'                  },
      { value: '12',  label: 'Grievances Resolved',        icon: 'bi-check2-circle',          color: '#2E7D32', trend: 'up',   trendValue: '+3'  },
    ],
  },

  estate: {
    commissioner: [
      { value: '1,234',   label: 'Municipal Properties',   icon: 'bi-map-fill',         color: '#5D4037', trend: 'neutral'                    },
      { value: '₹4.5 Cr', label: 'Rental Revenue (YTD)',   icon: 'bi-currency-rupee',   color: '#2E7D32', trend: 'up',   trendValue: '+8.2%' },
      { value: '89',       label: 'Lease Renewals Due',    icon: 'bi-arrow-repeat',     color: '#F57F17', trend: 'down', trendValue: '-23'   },
      { value: '34',       label: 'Encroachments Detected',icon: 'bi-exclamation-triangle-fill',color:'#E65100',trend:'down',trendValue:'-8'  },
    ],
    hod: [
      { value: '456', label: 'Properties Under Management',icon: 'bi-building-fill',  color: '#5D4037', trend: 'neutral'                  },
      { value: '89',  label: 'Lease Applications',         icon: 'bi-file-earmark-text-fill',color:'#F57F17',trend:'down',trendValue:'-12' },
      { value: '23',  label: 'Notice Issued',              icon: 'bi-envelope-fill',  color: '#E65100', trend: 'neutral'                  },
      { value: '12',  label: 'Eviction Actions',           icon: 'bi-x-circle-fill',  color: '#C2185B', trend: 'down', trendValue: '-3'  },
    ],
    accounts: [
      { value: '₹12.3 L', label: 'Rent Collected (Month)', icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹1.1L' },
      { value: '₹3.4 L',  label: 'Dues Outstanding',       icon: 'bi-exclamation-triangle-fill',color:'#E65100',trend:'down',trendValue:'-₹0.2L'},
      { value: '45',       label: 'Arrears Cases',          icon: 'bi-hourglass-split', color: '#F57F17', trend: 'down', trendValue: '-5'    },
      { value: '₹1.2 L',  label: 'Security Deposits',      icon: 'bi-bank2',           color: '#0077B6', trend: 'neutral'                   },
    ],
    operations: [
      { value: '45', label: 'Site Inspections Today', icon: 'bi-eye-fill',             color: '#5D4037', trend: 'up',   trendValue: '+8' },
      { value: '23', label: 'Rent Receipts Issued',  icon: 'bi-receipt',              color: '#2E7D32', trend: 'neutral'                  },
      { value: '12', label: 'Agreements Executed',   icon: 'bi-file-earmark-check-fill',color:'#0077B6',trend:'up',   trendValue:'+3'  },
      { value: '5',  label: 'Evictions Pending',     icon: 'bi-person-dash-fill',     color: '#E65100', trend: 'neutral'                  },
    ],
  },

  'market-licenses': {
    commissioner: [
      { value: '8,234',   label: 'Active Licenses',          icon: 'bi-shop-window',        color: '#F57F17', trend: 'up',   trendValue: '+345' },
      { value: '₹1.8 Cr', label: 'License Revenue (YTD)',    icon: 'bi-currency-rupee',     color: '#2E7D32', trend: 'up',   trendValue: '+10.2%'},
      { value: '1,234',   label: 'Renewals Due (This Month)',icon: 'bi-arrow-repeat',       color: '#F57F17', trend: 'down', trendValue: '-89'  },
      { value: '234',     label: 'Expired / Defaulters',     icon: 'bi-exclamation-triangle-fill',color:'#E65100',trend:'down',trendValue:'-45'},
    ],
    hod: [
      { value: '345', label: 'New Applications (Month)', icon: 'bi-file-earmark-text-fill',  color: '#F57F17', trend: 'up',   trendValue: '+67' },
      { value: '89',  label: 'Pending Inspections',      icon: 'bi-eye-fill',                color: '#E65100', trend: 'down', trendValue: '-23' },
      { value: '56',  label: 'Cancellation Notices',     icon: 'bi-x-circle-fill',           color: '#C2185B', trend: 'neutral'                  },
      { value: '12',  label: 'Appeals Pending',          icon: 'bi-chat-square-text-fill',   color: '#4A148C', trend: 'neutral'                  },
    ],
    accounts: [
      { value: '₹6.7 L',  label: 'License Fees (Month)',    icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹0.5L' },
      { value: '₹4.5 L',  label: 'Arrears Outstanding',     icon: 'bi-exclamation-triangle-fill',color:'#E65100',trend:'down',trendValue:'-₹0.3L'},
      { value: '89',       label: 'Demand Notices Pending',  icon: 'bi-hourglass-split', color: '#F57F17', trend: 'down', trendValue: '-12'   },
      { value: '₹0.8 L',  label: 'Fines Collected (Month)', icon: 'bi-bank2',           color: '#2E7D32', trend: 'up',   trendValue: '+₹0.1L'},
    ],
    operations: [
      { value: '234', label: 'Licenses Granted Today',    icon: 'bi-check2-circle',         color: '#F57F17', trend: 'up',   trendValue: '+34' },
      { value: '89',  label: 'Inspections Completed',     icon: 'bi-eye-fill',              color: '#0077B6', trend: 'neutral'                  },
      { value: '45',  label: 'Renewal Notices Issued',    icon: 'bi-envelope-fill',         color: '#F57F17', trend: 'up',   trendValue: '+5'  },
      { value: '12',  label: 'Cancellations Today',       icon: 'bi-x-circle-fill',         color: '#E65100', trend: 'neutral'                  },
    ],
  },

  'general-administration': {
    commissioner: [
      { value: '1,234',   label: 'Pending Files',              icon: 'bi-folder-fill',        color: '#4A148C', trend: 'down', trendValue: '-89'  },
      { value: '456',     label: 'Meetings Scheduled (Month)', icon: 'bi-calendar-event-fill',color: '#4A148C', trend: 'neutral'                   },
      { value: '89',      label: 'RTI Applications Pending',   icon: 'bi-file-earmark-text-fill',color:'#F57F17',trend:'down',trendValue:'-14'   },
      { value: '97.8%',   label: 'File Disposal Rate',         icon: 'bi-graph-up-arrow',     color: '#2E7D32', trend: 'up',   trendValue: '+0.5%'},
    ],
    hod: [
      { value: '567',  label: 'Files Received (Month)',    icon: 'bi-inbox-fill',            color: '#4A148C', trend: 'up',   trendValue: '+89' },
      { value: '456',  label: 'Files Processed',           icon: 'bi-file-earmark-check-fill',color:'#2E7D32',trend:'up',   trendValue: '+78' },
      { value: '111',  label: 'Under Processing',          icon: 'bi-arrow-repeat',          color: '#F57F17', trend: 'neutral'                  },
      { value: '23',   label: 'Overdue Files',             icon: 'bi-alarm-fill',            color: '#E65100', trend: 'down', trendValue: '-8'  },
    ],
    accounts: [
      { value: '₹5.6 L',  label: 'Admin Fees Collected',     icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹0.3L' },
      { value: '₹23.4 L', label: 'Operational Expenditure',  icon: 'bi-wallet2',        color: '#4A148C', trend: 'neutral'                    },
      { value: '₹8.9 L',  label: 'Budget Remaining',         icon: 'bi-piggy-bank-fill', color: '#0077B6', trend: 'neutral'                   },
      { value: '12',       label: 'Bills Awaiting Payment',   icon: 'bi-receipt',        color: '#F57F17', trend: 'down', trendValue: '-3'     },
    ],
    operations: [
      { value: '234', label: 'Files Disposed Today',    icon: 'bi-file-earmark-check-fill', color: '#2E7D32', trend: 'up',   trendValue: '+34' },
      { value: '89',  label: 'Letters Dispatched',      icon: 'bi-envelope-fill',           color: '#4A148C', trend: 'neutral'                  },
      { value: '45',  label: 'Staff Attendance',        icon: 'bi-person-check-fill',       color: '#0077B6', trend: 'neutral'                  },
      { value: '12',  label: 'Permissions Granted',     icon: 'bi-check2-circle',           color: '#2E7D32', trend: 'up',   trendValue: '+3'  },
    ],
  },

  pms: {
    commissioner: [
      { value: '1,842',    label: 'Total Employees',               icon: 'bi-people-fill',          color: '#1565C0', trend: 'neutral'                     },
      { value: '₹3.24 Cr', label: 'Current Month Salary',          icon: 'bi-currency-rupee',       color: '#2E7D32', trend: 'up',   trendValue: '+₹0.12Cr' },
      { value: '8',        label: 'Recently Retired (This Month)',  icon: 'bi-person-dash-fill',     color: '#5D4037', trend: 'neutral'                     },
      { value: '14',       label: 'Upcoming Retirements (90 days)',icon: 'bi-hourglass-split',      color: '#F57F17', trend: 'neutral'                     },
    ],
    hod: [
      { value: '1,842',    label: 'Total Employees',               icon: 'bi-people-fill',          color: '#1565C0', trend: 'neutral'                     },
      { value: '₹3.24 Cr', label: 'Current Month Salary',          icon: 'bi-currency-rupee',       color: '#2E7D32', trend: 'up',   trendValue: '+₹0.12Cr' },
      { value: '8',        label: 'Recently Retired (This Month)',  icon: 'bi-person-dash-fill',     color: '#5D4037', trend: 'neutral'                     },
      { value: '14',       label: 'Upcoming Retirements (90 days)',icon: 'bi-hourglass-split',      color: '#F57F17', trend: 'neutral'                     },
    ],
    accounts: [
      { value: '₹3.24 Cr', label: 'Current Month Salary',          icon: 'bi-currency-rupee',       color: '#2E7D32', trend: 'up',   trendValue: '+₹0.12Cr' },
      { value: '₹18.9 L',  label: 'Deductions This Month',         icon: 'bi-dash-circle-fill',     color: '#E65100', trend: 'neutral'                     },
      { value: '₹4.2 L',   label: 'Arrears Paid This Month',       icon: 'bi-clock-history',        color: '#F57F17', trend: 'neutral'                     },
      { value: '23',        label: 'Salary Advances Outstanding',   icon: 'bi-wallet2',              color: '#4A148C', trend: 'down', trendValue: '-3'       },
    ],
    operations: [
      { value: '1,842',    label: 'Total Employees',               icon: 'bi-people-fill',          color: '#1565C0', trend: 'neutral'                     },
      { value: '8',        label: 'Recently Retired (This Month)',  icon: 'bi-person-dash-fill',     color: '#5D4037', trend: 'neutral'                     },
      { value: '14',       label: 'Upcoming Retirements (90 days)',icon: 'bi-hourglass-split',      color: '#F57F17', trend: 'neutral'                     },
      { value: '₹3.24 Cr', label: 'Current Month Salary',          icon: 'bi-currency-rupee',       color: '#2E7D32', trend: 'up',   trendValue: '+₹0.12Cr' },
    ],
  },

  pwd: {
    commissioner: [
      { value: '234',     label: 'Works in Progress',        icon: 'bi-cone-striped',      color: '#37474F', trend: 'neutral'                    },
      { value: '₹12.3 Cr',label: 'Works Budget (Sanctioned)',icon: 'bi-currency-rupee',    color: '#37474F', trend: 'neutral'                    },
      { value: '45',      label: 'Works Completed (YTD)',    icon: 'bi-check2-circle',     color: '#2E7D32', trend: 'up',   trendValue: '+8'    },
      { value: '89.3%',   label: 'Budget Utilisation',       icon: 'bi-graph-up-arrow',    color: '#2E7D32', trend: 'up',   trendValue: '+3.2%' },
    ],
    hod: [
      { value: '89',  label: 'Tenders Floated (Month)',  icon: 'bi-file-earmark-text-fill', color: '#37474F', trend: 'up',   trendValue: '+12' },
      { value: '45',  label: 'Tenders Under Review',     icon: 'bi-search',                 color: '#F57F17', trend: 'down', trendValue: '-8'  },
      { value: '23',  label: 'Works Stalled',            icon: 'bi-exclamation-triangle-fill',color:'#E65100',trend:'down',trendValue:'-5'   },
      { value: '12',  label: 'Quality Inspections Due',  icon: 'bi-eye-fill',               color: '#0077B6', trend: 'neutral'                  },
    ],
    accounts: [
      { value: '₹3.4 Cr', label: 'Payments Released (Month)',icon: 'bi-cash-stack',     color: '#2E7D32', trend: 'up',   trendValue: '+₹0.4Cr'},
      { value: '₹1.2 Cr', label: 'Bills Pending Payment',   icon: 'bi-hourglass-split', color: '#F57F17', trend: 'down', trendValue: '-₹0.1Cr'},
      { value: '34',       label: 'MB Pending Check',        icon: 'bi-journal-text',   color: '#37474F', trend: 'neutral'                     },
      { value: '₹2.3 Cr', label: 'Retention Held',          icon: 'bi-bank2',           color: '#0077B6', trend: 'neutral'                    },
    ],
    operations: [
      { value: '45', label: 'Work Orders Issued Today', icon: 'bi-file-earmark-text-fill', color: '#37474F', trend: 'up',   trendValue: '+8' },
      { value: '23', label: 'Site Inspections Done',    icon: 'bi-eye-fill',               color: '#0077B6', trend: 'neutral'                  },
      { value: '12', label: 'Complaints Resolved',      icon: 'bi-check2-circle',          color: '#2E7D32', trend: 'up',   trendValue: '+3' },
      { value: '5',  label: 'Road Cuts Pending Restore',icon: 'bi-cone-striped',           color: '#E65100', trend: 'neutral'                  },
    ],
  },
}

function getStats(deptKey: string, view: DashboardViewKey): StatItem[] {
  return DEPT_STATS[deptKey]?.[view] ?? GENERIC_STATS[view]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  departmentKey: string
}

export default function DashboardPage({ departmentKey }: DashboardPageProps) {
  const user = currentUser()
  const role = (user?.role ?? 'unknown') as UserRole
  const { T, tStat } = useLanguage()

  const dept = DEPARTMENTS.find((d) => d.key === departmentKey)
  const deptT = T.depts[departmentKey]

  // ── Build translated view defs ────────────────────────────────────────────
  const VIEW_DEFS_T = [
    { key: 'commissioner' as DashboardViewKey, label: T.views.commissioner, icon: 'bi-award-fill'       },
    { key: 'hod'          as DashboardViewKey, label: T.views.hod,          icon: 'bi-diagram-3-fill'   },
    { key: 'accounts'     as DashboardViewKey, label: T.views.accounts,     icon: 'bi-bank2'            },
    { key: 'operations'   as DashboardViewKey, label: T.views.operations,   icon: 'bi-gear-fill'        },
  ]

  // ── Build translated table columns ────────────────────────────────────────
  const VIEW_TABLE_COLUMNS_T: Record<DashboardViewKey, { label: string; width?: string }[]> = {
    commissioner: [
      { label: T.tableColumns.departmentZone, width: '25%' },
      { label: T.tableColumns.demand,         width: '18%' },
      { label: T.tableColumns.collection,     width: '18%' },
      { label: T.tableColumns.pctAchieved,    width: '13%' },
      { label: T.tableColumns.status,         width: '13%' },
      { label: T.tableColumns.action,         width: '13%' },
    ],
    hod: [
      { label: T.tableColumns.applicationNo,  width: '20%' },
      { label: T.tableColumns.applicantName,  width: '27%' },
      { label: T.tableColumns.date,           width: '14%' },
      { label: T.tableColumns.type,           width: '14%' },
      { label: T.tableColumns.status,         width: '12%' },
      { label: T.tableColumns.action,         width: '13%' },
    ],
    accounts: [
      { label: T.tableColumns.receiptNo,      width: '18%' },
      { label: T.tableColumns.name,           width: '27%' },
      { label: T.tableColumns.amount,         width: '18%' },
      { label: T.tableColumns.mode,           width: '15%' },
      { label: T.tableColumns.date,           width: '12%' },
      { label: T.tableColumns.action,         width: '10%' },
    ],
    operations: [
      { label: T.tableColumns.taskId,         width: '14%' },
      { label: T.tableColumns.description,    width: '30%' },
      { label: T.tableColumns.assignedTo,     width: '20%' },
      { label: T.tableColumns.dueDate,        width: '15%' },
      { label: T.tableColumns.status,         width: '11%' },
      { label: T.tableColumns.action,         width: '10%' },
    ],
  }

  const allowedViewKeys: DashboardViewKey[] = ROLE_VIEWS[role] ?? ROLE_VIEWS.unknown
  const availableViews = VIEW_DEFS_T.filter((v) => allowedViewKeys.includes(v.key))

  const [activeView, setActiveView] = useState<DashboardViewKey>(
    availableViews[0]?.key ?? 'operations'
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [search,   setSearch]   = useState('')

  if (!dept) {
    return (
      <main className="erp-main">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {T.nav.deptNotFound}
        </p>
        <Link href="/" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
          {T.nav.backHome}
        </Link>
      </main>
    )
  }

  const stats   = getStats(departmentKey, activeView)
  const columns = VIEW_TABLE_COLUMNS_T[activeView]
  const activeViewDef = VIEW_DEFS_T.find((v) => v.key === activeView)

  return (
    <div className="dept-layout">
      <DeptSidebar
        deptKey={departmentKey}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <main className="erp-main">
      {/* ── Breadcrumb ── */}
      <nav className="dash-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="dash-breadcrumb-home">
          <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
        </Link>
        <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="dash-breadcrumb-current">{deptT?.label ?? dept.label}</span>
        <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="dash-breadcrumb-current">{T.nav.dashboard}</span>
      </nav>

      {/* ── Department Header ── */}
      <div className="dash-dept-header">
        <button
          type="button"
          className="dept-sidebar-toggle-btn"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} aria-hidden="true" />
        </button>
        <div
          className="dash-dept-icon"
          style={{ background: dept.colorBg, color: dept.color }}
          aria-hidden="true"
        >
          <i className={`bi ${dept.icon}`} />
        </div>
        <div className="dash-dept-info">
          <h1 className="dash-dept-title">{deptT?.label ?? dept.label}</h1>
          <p className="dash-dept-desc">{deptT?.description ?? dept.description}</p>
        </div>
        <div className="dash-role-badge" aria-label={`Logged in as ${role}`}>
          <i className="bi bi-person-badge-fill" aria-hidden="true" />
          <span>{role.toUpperCase()}</span>
        </div>
      </div>

      {/* ── View Selector Tabs ── */}
      <div className="dash-view-tabs" role="tablist" aria-label="Dashboard views">
        {availableViews.map((view) => (
          <button
            key={view.key}
            role="tab"
            aria-selected={activeView === view.key}
            className={`dash-view-tab${activeView === view.key ? ' active' : ''}`}
            onClick={() => setActiveView(view.key)}
          >
            <i className={`bi ${view.icon}`} aria-hidden="true" />
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      {/* ── Filters Bar ── */}
      <div className="dash-filters" role="search" aria-label="Dashboard filters">
        <div className="dash-filter-group">
          <label htmlFor={`df-from-${departmentKey}`} className="dash-filter-label">
            {T.filters.from}
          </label>
          <input
            id={`df-from-${departmentKey}`}
            type="date"
            className="dash-filter-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="dash-filter-group">
          <label htmlFor={`df-to-${departmentKey}`} className="dash-filter-label">
            {T.filters.to}
          </label>
          <input
            id={`df-to-${departmentKey}`}
            type="date"
            className="dash-filter-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="dash-filter-group dash-filter-search">
          <label htmlFor={`df-search-${departmentKey}`} className="dash-filter-label">
            {T.filters.search}
          </label>
          <div className="dash-filter-search-wrap">
            <i className="bi bi-search dash-filter-search-icon" aria-hidden="true" />
            <input
              id={`df-search-${departmentKey}`}
              type="search"
              className="dash-filter-input"
              placeholder={T.filters.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="dash-filter-actions">
          <button type="button" className="dash-filter-btn-apply">
            <i className="bi bi-funnel-fill" aria-hidden="true" /> {T.filters.apply}
          </button>
          <button
            type="button"
            className="dash-filter-btn-reset"
            onClick={() => {
              setDateFrom('')
              setDateTo('')
              setSearch('')
            }}
          >
            <i className="bi bi-x-circle" aria-hidden="true" /> {T.filters.reset}
          </button>
        </div>
      </div>

      {/* ── KPI Stats Grid ── */}
      <div className="dash-stats-grid" aria-label="Key performance indicators">
        {stats.map((stat, i) => (
          <div key={i} className="dash-stat-card">
            <div
              className="dash-stat-icon-wrap"
              style={{ background: `${stat.color}18`, color: stat.color }}
              aria-hidden="true"
            >
              <i className={`bi ${stat.icon}`} />
            </div>
            <div className="dash-stat-body">
              <span className="dash-stat-value">{stat.value}</span>
              <span className="dash-stat-label">{tStat(stat.label)}</span>
              {stat.trendValue && (
                <span className={`dash-stat-trend ${stat.trend}`}>
                  {stat.trend === 'up'   && <i className="bi bi-arrow-up-short"   aria-hidden="true" />}
                  {stat.trend === 'down' && <i className="bi bi-arrow-down-short" aria-hidden="true" />}
                  {stat.trendValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Data Table ── */}
      <div className="dash-data-section">
        <div className="dash-data-header">
          <h2 className="dash-data-title">
            {activeViewDef?.label} — {T.table.records}
          </h2>
          <div className="dash-data-header-actions">
            <button type="button" className="dash-data-btn">
              <i className="bi bi-download" aria-hidden="true" /> {T.table.export}
            </button>
            <button type="button" className="dash-data-btn dash-data-btn-primary">
              <i className="bi bi-plus-lg" aria-hidden="true" /> {T.table.newRecord}
            </button>
          </div>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table" aria-label={`${deptT?.label ?? dept.label} — ${activeViewDef?.label} records`}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={{ width: col.width }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className="dash-table-empty">
                  <div className="dash-empty-state">
                    <i className="bi bi-database-fill-slash" aria-hidden="true" />
                    <p>{T.table.emptyTitle}</p>
                    <span>{T.table.emptyDesc}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </div>
  )
}
