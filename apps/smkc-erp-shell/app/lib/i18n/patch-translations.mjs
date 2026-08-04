import { readFileSync, writeFileSync } from 'fs'

const filePath = 'c:/Users/ACER/source/repos/SMKC-ERP/smkc-erp/apps/smkc-erp-shell/app/lib/i18n/translations.ts'

let src = readFileSync(filePath, 'utf8')

// 1. Update the groups type definition (line ~55-59) to add departmental-samaj
src = src.replace(
  /groups: \{\s*\n\s*transactions: string\s*\n\s*applications: string\s*\n\s*reports: string\s*\n\s*masters: string\s*\n\s*\}/,
  `groups: {\n    transactions: string\n    applications: string\n    reports: string\n    masters: string\n    'departmental-samaj': string\n  }`
)

// 2. English groups object
src = src.replace(
  "groups: {\n    transactions: 'Transactions',\n    applications: 'Applications',\n    reports: 'Reports',\n    masters: 'Masters',\n  },",
  "groups: {\n    transactions: 'Transactions',\n    applications: 'Applications',\n    reports: 'Reports',\n    masters: 'Masters',\n    'departmental-samaj': 'Departmental Samaj',\n  },"
)

// 3. Marathi groups object
src = src.replace(
  "\u0935\u094d\u092f\u0935\u0939\u093e\u0930", // व्यवहार - find the Marathi groups block
  '\u0935\u094d\u092f\u0935\u0939\u093e\u0930'   // keep as-is, we'll target uniquely
)

// Use a more specific replacement for the Marathi groups block
const marathiGroupsOld = `groups: {\n    transactions: '\u0935\u094d\u092f\u0935\u0939\u093e\u0930',\n    applications: '\u0905\u0930\u094d\u091c',\n    reports: '\u0905\u0939\u0935\u093e\u0932',\n    masters: '\u092e\u093e\u0938\u094d\u091f\u0930',\n  },`
const marathiGroupsNew = `groups: {\n    transactions: '\u0935\u094d\u092f\u0935\u0939\u093e\u0930',\n    applications: '\u0905\u0930\u094d\u091c',\n    reports: '\u0905\u0939\u0935\u093e\u0932',\n    masters: '\u092e\u093e\u0938\u094d\u091f\u0930',\n    'departmental-samaj': '\u0935\u093f\u092d\u093e\u0917\u0940\u092f \u0938\u092e\u091c',\n  },`

src = src.replace(marathiGroupsOld, marathiGroupsNew)

writeFileSync(filePath, src, 'utf8')
console.log('translations.ts updated successfully.')
