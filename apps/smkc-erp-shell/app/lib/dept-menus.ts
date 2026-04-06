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
  key: 'transactions' | 'applications' | 'reports' | 'masters'
  label: string
  icon: string
  items: MenuItem[]
}

export type DeptMenuMap = Record<string, MenuGroup[]>

export const DEPT_MENUS: DeptMenuMap = {
  'water-tax': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'meter-reading',       label: 'Meter Reading Entry',          icon: 'bi-speedometer2' },
        { key: 'bill-generation',     label: 'Bill Generation',              icon: 'bi-receipt' },
        { key: 'payment-collection',  label: 'Payment Collection',           icon: 'bi-cash-stack' },
        { key: 'meter-replacement',   label: 'Meter Replacement',            icon: 'bi-tools' },
        { key: 'disconnection',       label: 'Disconnection / Reconnection', icon: 'bi-plug-fill' },
        { key: 'connection-transfer', label: 'Connection Transfer',          icon: 'bi-arrow-repeat' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'new-connection',       label: 'New Connection',         icon: 'bi-plus-circle-fill' },
        { key: 'reconnection-request', label: 'Reconnection Request',   icon: 'bi-plug' },
        { key: 'name-change',          label: 'Name Change',            icon: 'bi-person-fill-gear' },
        { key: 'change-of-use',        label: 'Change of Use',          icon: 'bi-house-gear-fill' },
        { key: 'leakage-complaint',    label: 'Leakage / Complaint',    icon: 'bi-exclamation-circle-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'demand-register',     label: 'Demand Register',        icon: 'bi-journal-text' },
        { key: 'collection-register', label: 'Collection Register',    icon: 'bi-collection-fill' },
        { key: 'outstanding-dues',    label: 'Outstanding Dues',       icon: 'bi-exclamation-triangle-fill' },
        { key: 'defaulter-list',      label: 'Defaulter List',         icon: 'bi-person-x-fill' },
        { key: 'zone-collection',     label: 'Zone-wise Collection',   icon: 'bi-map-fill' },
        { key: 'daily-collection',    label: 'Daily Collection',       icon: 'bi-calendar-day-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'rate-tariff', label: 'Rate / Tariff', icon: 'bi-percent' },
        { key: 'zone-ward',   label: 'Zone / Ward',   icon: 'bi-geo-alt-fill' },
        { key: 'pipe-size',   label: 'Pipe Size',     icon: 'bi-bezier' },
        { key: 'contractor',  label: 'Contractor',    icon: 'bi-person-badge-fill' },
      ],
    },
  ],

  'accounts': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'voucher-entry',       label: 'Journal / Voucher Entry', icon: 'bi-journal-plus' },
        { key: 'receipt-entry',       label: 'Receipt Entry',           icon: 'bi-receipt' },
        { key: 'payment-voucher',     label: 'Payment Voucher',         icon: 'bi-send-fill' },
        { key: 'bank-reconciliation', label: 'Bank Reconciliation',     icon: 'bi-bank2' },
        { key: 'budget-allocation',   label: 'Budget Allocation',       icon: 'bi-pie-chart-fill' },
        { key: 'cheque-issuance',     label: 'Cheque Issuance',         icon: 'bi-file-earmark-checked' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'advance-request',     label: 'Advance Request',      icon: 'bi-wallet2' },
        { key: 'budget-reallocation', label: 'Budget Reallocation',  icon: 'bi-arrow-left-right' },
        { key: 'deposit-manager',     label: 'Deposit Manager',      icon: 'bi-safe2-fill', href: 'http://localhost:3000/depositmanager', external: true },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'trial-balance',         label: 'Trial Balance',              icon: 'bi-scale' },
        { key: 'income-expenditure',    label: 'Income & Expenditure',       icon: 'bi-graph-up-arrow' },
        { key: 'balance-sheet',         label: 'Balance Sheet',              icon: 'bi-clipboard-data-fill' },
        { key: 'cash-bank-book',        label: 'Cash Book / Bank Book',      icon: 'bi-cash-coin' },
        { key: 'dept-expenditure',      label: 'Dept-wise Expenditure',      icon: 'bi-diagram-3-fill' },
        { key: 'budget-vs-actual',      label: 'Budget vs Actual',           icon: 'bi-bar-chart-line-fill' },
        { key: 'audit-report',          label: 'Audit Report',               icon: 'bi-shield-check' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'chart-of-accounts', label: 'Chart of Accounts', icon: 'bi-list-columns-reverse' },
        { key: 'budget-heads',      label: 'Budget Heads',      icon: 'bi-bookmarks-fill' },
        { key: 'bank-master',       label: 'Bank Master',       icon: 'bi-bank' },
        { key: 'vendor-master',     label: 'Vendor Master',     icon: 'bi-people-fill' },
      ],
    },
  ],

  'property-tax': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'new-assessment',      label: 'New Property Assessment', icon: 'bi-house-add-fill' },
        { key: 'payment-collection',  label: 'Payment Collection',      icon: 'bi-cash-stack' },
        { key: 'self-assessment',     label: 'Self-Assessment Entry',   icon: 'bi-pencil-square' },
        { key: 'name-change',         label: 'Name Change',             icon: 'bi-person-fill-gear' },
        { key: 'objection-appeal',    label: 'Objection / Appeal',      icon: 'bi-chat-square-text-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'new-holding',     label: 'New Holding Application',   icon: 'bi-house-fill' },
        { key: 'mutation',        label: 'Mutation / Transfer',        icon: 'bi-arrow-left-right' },
        { key: 'exemption',       label: 'Exemption Application',     icon: 'bi-patch-check-fill' },
        { key: 'bifurcation',     label: 'Bifurcation / Amalgamation',icon: 'bi-intersect' },
        { key: 'demolition-noc',  label: 'Demolition NOC',            icon: 'bi-building-x' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'demand-register',     label: 'Demand Register',      icon: 'bi-journal-text' },
        { key: 'collection-register', label: 'Collection Register',  icon: 'bi-collection-fill' },
        { key: 'defaulter-list',      label: 'Defaulter List',       icon: 'bi-person-x-fill' },
        { key: 'new-assessments',     label: 'New Assessments',      icon: 'bi-house-check-fill' },
        { key: 'zone-collection',     label: 'Zone-wise Collection', icon: 'bi-map-fill' },
        { key: 'daily-collection',    label: 'Daily Collection',     icon: 'bi-calendar-day-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'property-type', label: 'Property Type', icon: 'bi-house-gear-fill' },
        { key: 'usage-type',    label: 'Usage Type',    icon: 'bi-tags-fill' },
        { key: 'zone-ward',     label: 'Zone / Ward',   icon: 'bi-geo-alt-fill' },
        { key: 'tax-rate',      label: 'Tax Rate',      icon: 'bi-percent' },
      ],
    },
  ],

  'general-administration': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'leave-approval',      label: 'Leave Approval',          icon: 'bi-calendar-check-fill' },
        { key: 'payroll-processing',  label: 'Payroll Processing',      icon: 'bi-cash-coin' },
        { key: 'office-order',        label: 'Office Order / Circular', icon: 'bi-megaphone-fill' },
        { key: 'asset-entry',         label: 'Asset Entry',             icon: 'bi-box-seam-fill' },
        { key: 'meeting-scheduling',  label: 'Meeting Scheduling',      icon: 'bi-calendar-event-fill' },
        { key: 'employee-onboarding', label: 'Employee Onboarding',     icon: 'bi-person-fill-add' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'leave-application',  label: 'Leave Application',       icon: 'bi-file-earmark-text-fill' },
        { key: 'transfer-request',   label: 'Employee Transfer',       icon: 'bi-arrow-left-right' },
        { key: 'rti-grievance',      label: 'Grievance (RTI)',         icon: 'bi-chat-square-text-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'attendance-register', label: 'Attendance Register', icon: 'bi-person-check-fill' },
        { key: 'leave-balance',       label: 'Leave Balance',        icon: 'bi-calendar3' },
        { key: 'service-records',     label: 'Service Records',      icon: 'bi-file-person-fill' },
        { key: 'orders-register',     label: 'Orders Register',      icon: 'bi-journal-bookmark-fill' },
        { key: 'grievance-status',    label: 'Grievance Status',     icon: 'bi-chat-dots-fill' },
        { key: 'asset-register',      label: 'Asset Register',       icon: 'bi-box-seam-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'employee',       label: 'Employee',          icon: 'bi-people-fill' },
        { key: 'designation',    label: 'Designation',       icon: 'bi-person-badge-fill' },
        { key: 'department',     label: 'Department / Post', icon: 'bi-diagram-3-fill' },
        { key: 'leave-type',     label: 'Leave Type',        icon: 'bi-calendar2-x-fill' },
        { key: 'asset-category', label: 'Asset Category',    icon: 'bi-tags-fill' },
      ],
    },
  ],

  'marriage': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'registration-entry',   label: 'Registration Entry',    icon: 'bi-pencil-square' },
        { key: 'fee-collection',       label: 'Fee Collection',        icon: 'bi-cash-stack' },
        { key: 'certificate-printing', label: 'Certificate Printing',  icon: 'bi-printer-fill' },
        { key: 'appointment',          label: 'Appointment Scheduling',icon: 'bi-calendar-plus-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'new-registration',     label: 'New Registration',         icon: 'bi-file-earmark-plus-fill' },
        { key: 'duplicate-certificate',label: 'Duplicate Certificate',    icon: 'bi-files' },
        { key: 'name-change',          label: 'Name Change (Post-Marriage)',icon: 'bi-person-fill-gear' },
        { key: 'record-correction',    label: 'Record Correction',        icon: 'bi-pen-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'registration-register', label: 'Registration Register', icon: 'bi-journal-text' },
        { key: 'monthly-registrations', label: 'Monthly Registrations', icon: 'bi-calendar-month-fill' },
        { key: 'pending-applications',  label: 'Pending Applications',  icon: 'bi-hourglass-split' },
        { key: 'revenue-collection',    label: 'Revenue Collection',    icon: 'bi-cash-coin' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'act-type', label: 'Marriage Act Type', icon: 'bi-bookmarks-fill' },
        { key: 'venue',    label: 'Venue',              icon: 'bi-geo-alt-fill' },
      ],
    },
  ],

  'women-child-welfare': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'beneficiary-enrollment',  label: 'Beneficiary Enrollment',  icon: 'bi-person-fill-add' },
        { key: 'document-verification',   label: 'Document Verification',   icon: 'bi-file-earmark-check-fill' },
        { key: 'benefit-disbursement',    label: 'Benefit Disbursement',    icon: 'bi-cash-stack' },
        { key: 'camp-registration',       label: 'Camp / Event Registration',icon: 'bi-calendar-event-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'disability-registration', label: 'Disability Registration', icon: 'bi-person-hearts' },
        { key: 'scholarship-application', label: 'Scholarship Application', icon: 'bi-mortarboard-fill' },
        { key: 'scheme-enrollment',       label: 'Scheme Enrollment',       icon: 'bi-file-earmark-text-fill' },
        { key: 'grievance-complaint',     label: 'Grievance / Complaint',   icon: 'bi-chat-square-text-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'beneficiary-list',       label: 'Beneficiary List',         icon: 'bi-people-fill' },
        { key: 'scheme-distribution',    label: 'Scheme-wise Distribution', icon: 'bi-pie-chart-fill' },
        { key: 'disabilities-register',  label: 'Disabilities Register',    icon: 'bi-journal-text' },
        { key: 'monthly-progress',       label: 'Monthly Progress',         icon: 'bi-graph-up-arrow' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'scheme',           label: 'Scheme',         icon: 'bi-award-fill' },
        { key: 'disability-type',  label: 'Disability Type',icon: 'bi-heart-pulse-fill' },
        { key: 'ward',             label: 'Ward',           icon: 'bi-geo-alt-fill' },
      ],
    },
  ],

  'estate': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'lease-allotment',  label: 'Lease / Allotment Entry', icon: 'bi-file-earmark-plus-fill' },
        { key: 'rent-collection',  label: 'Rent Collection',         icon: 'bi-cash-stack' },
        { key: 'lease-renewal',    label: 'Lease Renewal',           icon: 'bi-arrow-repeat' },
        { key: 'eviction-notice',  label: 'Eviction Notice',         icon: 'bi-envelope-exclamation-fill' },
        { key: 'property-inspection',label: 'Property Inspection',   icon: 'bi-eye-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'lease-application', label: 'Lease Application',    icon: 'bi-file-earmark-text-fill' },
        { key: 'noc-application',   label: 'NOC Application',      icon: 'bi-patch-check-fill' },
        { key: 'encroachment',      label: 'Encroachment Removal', icon: 'bi-x-circle-fill' },
        { key: 'temp-use',          label: 'Temp Use Permission',  icon: 'bi-calendar-event-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'lease-register',       label: 'Lease Register',          icon: 'bi-journal-text' },
        { key: 'rent-collection-report',label: 'Rent Due & Collection',  icon: 'bi-cash-coin' },
        { key: 'arrears-report',        label: 'Arrears Report',         icon: 'bi-exclamation-triangle-fill' },
        { key: 'allotment-status',      label: 'Allotment Status',       icon: 'bi-map-fill' },
        { key: 'encroachment-report',   label: 'Encroachment Report',    icon: 'bi-geo-alt-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'property-plot', label: 'Property / Plot', icon: 'bi-map-fill' },
        { key: 'lease-type',    label: 'Lease Type',      icon: 'bi-tags-fill' },
        { key: 'rate',          label: 'Rate',            icon: 'bi-percent' },
      ],
    },
  ],

  'market-licenses': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'license-issuance',  label: 'License Issuance',    icon: 'bi-patch-check-fill' },
        { key: 'fee-collection',    label: 'Fee Collection',       icon: 'bi-cash-stack' },
        { key: 'inspection-entry',  label: 'Inspection Entry',     icon: 'bi-eye-fill' },
        { key: 'notice-warning',    label: 'Notice / Warning',     icon: 'bi-envelope-exclamation-fill' },
        { key: 'prosecution-entry', label: 'Prosecution Entry',    icon: 'bi-gavel' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'new-license',   label: 'New License Application', icon: 'bi-file-earmark-plus-fill' },
        { key: 'renewal',       label: 'Renewal Application',     icon: 'bi-arrow-repeat' },
        { key: 'transfer',      label: 'Transfer Application',    icon: 'bi-arrow-left-right' },
        { key: 'duplicate',     label: 'Duplicate License',       icon: 'bi-files' },
        { key: 'cancellation',  label: 'Cancellation',            icon: 'bi-x-circle-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'active-licenses',    label: 'Active Licenses Register', icon: 'bi-collection-fill' },
        { key: 'expired-licenses',   label: 'Expired Licenses',         icon: 'bi-calendar-x-fill' },
        { key: 'revenue-collection', label: 'Revenue Collection',       icon: 'bi-cash-coin' },
        { key: 'defaulter-list',     label: 'Defaulter List',           icon: 'bi-person-x-fill' },
        { key: 'ward-summary',       label: 'Ward-wise Summary',        icon: 'bi-map-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'license-type',    label: 'License Type',    icon: 'bi-tags-fill' },
        { key: 'trade-category',  label: 'Trade Category',  icon: 'bi-shop-window' },
        { key: 'fee',             label: 'Fee Structure',   icon: 'bi-percent' },
        { key: 'ward-zone',       label: 'Ward / Zone',     icon: 'bi-geo-alt-fill' },
      ],
    },
  ],

  'fire': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'noc-issuance',      label: 'NOC Issuance',            icon: 'bi-patch-check-fill' },
        { key: 'incident-entry',    label: 'Fire Incident Entry',     icon: 'bi-fire' },
        { key: 'inspection-entry',  label: 'Inspection Entry',        icon: 'bi-eye-fill' },
        { key: 'vehicle-log',       label: 'Vehicle / Equipment Log', icon: 'bi-truck-front-fill' },
        { key: 'duty-roster',       label: 'Staff Duty Roster',       icon: 'bi-calendar-week-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'noc-application',   label: 'NOC Application',          icon: 'bi-file-earmark-text-fill' },
        { key: 'safety-audit',      label: 'Fire Safety Audit Request',icon: 'bi-clipboard-check-fill' },
        { key: 'complaint',         label: 'Complaint Registration',   icon: 'bi-exclamation-circle-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'noc-register',          label: 'NOC Register',              icon: 'bi-journal-text' },
        { key: 'incident-report',       label: 'Fire Incident Report',      icon: 'bi-fire' },
        { key: 'monthly-incident',      label: 'Monthly Incident Summary',  icon: 'bi-calendar-month-fill' },
        { key: 'building-inspection',   label: 'Building Inspection',       icon: 'bi-building-fill' },
        { key: 'equipment-maintenance', label: 'Equipment Maintenance',     icon: 'bi-wrench-adjustable-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'building-type', label: 'Building Type',   icon: 'bi-building-fill' },
        { key: 'equipment',     label: 'Equipment',       icon: 'bi-tools' },
        { key: 'violation',     label: 'Violation / Offense', icon: 'bi-exclamation-triangle-fill' },
      ],
    },
  ],

  'health': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'birth-registration',  label: 'Birth Registration',       icon: 'bi-person-fill-add' },
        { key: 'death-registration',  label: 'Death Registration',       icon: 'bi-file-earmark-medical-fill' },
        { key: 'food-license',        label: 'Food License Issuance',    icon: 'bi-shop-window' },
        { key: 'vaccination-camp',    label: 'Vaccination Camp Entry',   icon: 'bi-activity' },
        { key: 'sanitation-inspection',label: 'Sanitation Inspection',   icon: 'bi-eye-fill' },
        { key: 'slaughterhouse',      label: 'Slaughterhouse Permission',icon: 'bi-file-earmark-text-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'duplicate-birth',     label: 'Duplicate Birth Certificate', icon: 'bi-files' },
        { key: 'duplicate-death',     label: 'Duplicate Death Certificate', icon: 'bi-files' },
        { key: 'food-license-app',    label: 'Food License Application',    icon: 'bi-file-earmark-plus-fill' },
        { key: 'health-noc',          label: 'Health NOC Application',      icon: 'bi-patch-check-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'birth-register',       label: 'Birth Register',           icon: 'bi-journal-text' },
        { key: 'death-register',       label: 'Death Register',           icon: 'bi-journal-text' },
        { key: 'birth-death-stats',    label: 'Birth / Death Statistics', icon: 'bi-graph-up-arrow' },
        { key: 'food-license-register',label: 'Food License Register',    icon: 'bi-collection-fill' },
        { key: 'monthly-health',       label: 'Monthly Health Report',    icon: 'bi-calendar-month-fill' },
        { key: 'vaccination-coverage', label: 'Vaccination Coverage',     icon: 'bi-shield-fill-check' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'hospital',        label: 'Hospital / Clinic', icon: 'bi-hospital-fill' },
        { key: 'cause-of-death',  label: 'Cause of Death',    icon: 'bi-clipboard-data-fill' },
        { key: 'disease',         label: 'Disease',           icon: 'bi-bio' },
        { key: 'vaccine',         label: 'Vaccine',           icon: 'bi-capsule-pill' },
      ],
    },
  ],

  'pwd': [
    {
      key: 'transactions', label: 'Transactions', icon: 'bi-arrow-left-right',
      items: [
        { key: 'work-order',       label: 'Work Order Issuance',      icon: 'bi-file-earmark-plus-fill' },
        { key: 'work-progress',    label: 'Work Progress Entry',      icon: 'bi-graph-up-arrow' },
        { key: 'measurement-book', label: 'Measurement Book Entry',   icon: 'bi-journal-plus' },
        { key: 'bill-processing',  label: 'Bill Processing',          icon: 'bi-receipt' },
        { key: 'road-cutting',     label: 'Road Cutting Permission',  icon: 'bi-cone-striped' },
        { key: 'asset-entry',      label: 'Asset / Infrastructure Entry', icon: 'bi-building-fill' },
      ],
    },
    {
      key: 'applications', label: 'Applications', icon: 'bi-file-earmark-text-fill',
      items: [
        { key: 'road-cutting-permit',    label: 'Road Cutting Permit',           icon: 'bi-exclamation-diamond-fill' },
        { key: 'completion-certificate', label: 'Work Completion Certificate',   icon: 'bi-patch-check-fill' },
        { key: 'infra-noc',              label: 'Infrastructure NOC',            icon: 'bi-file-earmark-check-fill' },
        { key: 'encroachment',           label: 'Encroachment Permission',       icon: 'bi-geo-alt-fill' },
      ],
    },
    {
      key: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill',
      items: [
        { key: 'work-order-register',  label: 'Work Order Register',    icon: 'bi-journal-text' },
        { key: 'progress-report',      label: 'Progress Report',        icon: 'bi-bar-chart-steps' },
        { key: 'contractor-work',      label: 'Contractor-wise Work',   icon: 'bi-person-badge-fill' },
        { key: 'budget-utilization',   label: 'Budget Utilization',     icon: 'bi-pie-chart-fill' },
        { key: 'pending-works',        label: 'Pending Works',          icon: 'bi-hourglass-split' },
        { key: 'asset-register',       label: 'Asset Register',         icon: 'bi-building-fill' },
      ],
    },
    {
      key: 'masters', label: 'Masters', icon: 'bi-database-fill-gear',
      items: [
        { key: 'work-type',     label: 'Work Type',     icon: 'bi-cone-striped' },
        { key: 'contractor',    label: 'Contractor',    icon: 'bi-person-badge-fill' },
        { key: 'material-rate', label: 'Material Rate', icon: 'bi-currency-rupee' },
        { key: 'ward-zone',     label: 'Ward / Zone',   icon: 'bi-geo-alt-fill' },
      ],
    },
  ],
}
