import { readFileSync, writeFileSync } from 'fs'

const filePath = 'c:/Users/ACER/source/repos/SMKC-ERP/smkc-erp/apps/smkc-erp-shell/app/lib/i18n/translations.ts'

let src = readFileSync(filePath, 'utf8')

// The Marathi groups block – use Unicode escapes for Devanagari
const oldMarathi = "    masters: '\u092e\u093e\u0938\u094d\u091f\u0930',\n  },\n\n  views: {\n    commissioner: '\u0906\u092f\u0941\u0915\u094d\u0924"
const newMarathi = "    masters: '\u092e\u093e\u0938\u094d\u091f\u0930',\n    'departmental-samaj': '\u0935\u093f\u092d\u093e\u0917\u0940\u092f \u0938\u092e\u091c',\n  },\n\n  views: {\n    commissioner: '\u0906\u092f\u0941\u0915\u094d\u0924"

if (src.includes(oldMarathi)) {
  src = src.replace(oldMarathi, newMarathi)
  writeFileSync(filePath, src, 'utf8')
  console.log('Marathi translation added successfully.')
} else {
  // Try with \r\n
  const oldCrlf = oldMarathi.replace(/\n/g, '\r\n')
  const newCrlf = newMarathi.replace(/\n/g, '\r\n')
  if (src.includes(oldCrlf)) {
    src = src.replace(oldCrlf, newCrlf)
    writeFileSync(filePath, src, 'utf8')
    console.log('Marathi translation added (CRLF) successfully.')
  } else {
    // Fallback: find and replace using index
    const maratiMastersLine = "    masters: '\u092e\u093e\u0938\u094d\u091f\u0930',"
    const idx = src.lastIndexOf(maratiMastersLine)
    if (idx === -1) {
      console.error('Could not find Marathi masters line. Searching raw...')
      const bytes = Buffer.from(src, 'utf8')
      console.log('File size:', bytes.length)
      // Print last chars around line 748-755
      const lines = src.split(/\r?\n/)
      for (let i = 745; i < Math.min(760, lines.length); i++) {
        console.log(`Line ${i+1}: ${JSON.stringify(lines[i])}`)
      }
    } else {
      const insertAfter = idx + maratiMastersLine.length
      const insertion = "\n    'departmental-samaj': '\u0935\u093f\u092d\u093e\u0917\u0940\u092f \u0938\u092e\u091c',"
      src = src.slice(0, insertAfter) + insertion + src.slice(insertAfter)
      writeFileSync(filePath, src, 'utf8')
      console.log('Marathi translation inserted by index successfully.')
    }
  }
}
