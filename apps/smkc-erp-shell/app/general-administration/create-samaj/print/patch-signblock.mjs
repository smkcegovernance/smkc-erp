import { readFileSync, writeFileSync } from 'fs'

const filePath = 'c:/Users/ACER/source/repos/SMKC-ERP/smkc-erp/apps/smkc-erp-shell/app/general-administration/create-samaj/print/page.tsx'

let src = readFileSync(filePath, 'utf8')

// 1. Add signingOfficerDesignation to interface
const oldInterface = "  signingOfficerName: string\n  supervisorName: string"
const newInterface = "  signingOfficerName: string\n  signingOfficerDesignation: string\n  supervisorName: string"
src = src.replace(oldInterface, newInterface)

// 2. Replace the sign-inner block: remove digital sig, add manual space, show designation
const oldSignBlock = `        {/* Signature block */}
        <div className="sign-block">
          <div className="sign-inner">
            <div style={{ fontSize: '10pt', color: '#333', marginBottom: 4 }}>
              Digitally signed by &apos;CN=DS SANGLI&apos;
            </div>
            <div style={{ fontSize: '10pt', color: '#333', marginBottom: 8 }}>
              Date: {displayDate}, Reason: Approved<br />Location: SMKMC
            </div>
            <div style={{ fontWeight: 700 }}>
              {data.signingOfficerName || '\u0905\u0927\u093f\u0915\u0943\u0924 \u0905\u0927\u093f\u0915\u093e\u0930\u0940'}
            </div>
            <div style={{ fontSize: '11pt' }}>
              \u0938\u093e\u0902\u0917\u0932\u0940 \u092e\u093f\u0930\u091c \u0906\u0923\u093f \u0915\u0941\u092a\u0935\u093e\u0921 \u0936\u0939\u0930 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u093e
            </div>
          </div>
        </div>`

const newSignBlock = `        {/* Signature block */}
        <div className="sign-block">
          <div className="sign-inner">
            {/* Manual signature space */}
            <div style={{ height: 60, borderBottom: '1px solid #555', marginBottom: 8, minWidth: 220 }} />
            <div style={{ fontWeight: 700, fontSize: '13pt' }}>
              {data.signingOfficerName || '\u0905\u0927\u093f\u0915\u0943\u0924 \u0905\u0927\u093f\u0915\u093e\u0930\u0940'}
            </div>
            {data.signingOfficerDesignation && (
              <div style={{ fontSize: '11pt', marginTop: 2 }}>
                {data.signingOfficerDesignation}
              </div>
            )}
            <div style={{ fontSize: '11pt', marginTop: 2 }}>
              \u0938\u093e\u0902\u0917\u0932\u0940 \u092e\u093f\u0930\u091c \u0906\u0923\u093f \u0915\u0941\u092a\u0935\u093e\u0921 \u0936\u0939\u0930 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u093e
            </div>
          </div>
        </div>`

if (src.includes(oldSignBlock)) {
  src = src.replace(oldSignBlock, newSignBlock)
  writeFileSync(filePath, src, 'utf8')
  console.log('Sign block updated successfully.')
} else {
  // Try CRLF
  const oldCrlf = oldSignBlock.replace(/\n/g, '\r\n')
  const newCrlf = newSignBlock.replace(/\n/g, '\r\n')
  if (src.includes(oldCrlf)) {
    src = src.replace(oldCrlf, newCrlf)
    writeFileSync(filePath, src, 'utf8')
    console.log('Sign block updated (CRLF) successfully.')
  } else {
    console.error('Could not find sign block. Searching...')
    const idx = src.indexOf('Digitally signed by')
    console.log('Digitally signed at char index:', idx)
    if (idx !== -1) {
      const start = src.lastIndexOf('{/* Signature block */}', idx)
      const end = src.indexOf('</div>\n        </div>', idx) + '</div>\n        </div>'.length
      console.log('Block from', start, 'to', end)
      console.log('Found text:', JSON.stringify(src.slice(start, end)))
    }
  }
}
