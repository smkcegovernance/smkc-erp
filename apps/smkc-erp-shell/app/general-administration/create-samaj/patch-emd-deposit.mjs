import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pagePath = join(__dirname, 'page.tsx')

let src = readFileSync(pagePath, 'utf8')

// ── 1. Add emdPct / depositPct state after deposit state ─────────────────────
src = src.replace(
  '  const [emd, setEmd] = useState(false)\n  const [deposit, setDeposit] = useState(false)',
  '  const [emd, setEmd] = useState(false)\n  const [emdPct, setEmdPct] = useState(1)\n  const [deposit, setDeposit] = useState(false)\n  const [depositPct, setDepositPct] = useState(5)'
)

// ── 2. Add computed emdAmt / depositAmt before doSearch ──────────────────────
src = src.replace(
  '  async function doSearch() {',
  '  const _baseAmt = parseFloat(vendorAmt) || 0\n  const emdAmt = emd ? Math.round(_baseAmt * emdPct / 100) : 0\n  const depositAmt = deposit ? Math.round(_baseAmt * depositPct / 100) : 0\n\n  async function doSearch() {'
)

// ── 3. Replace the static checkbox col-12 with expandable rows ────────────────
// Marker strings that are safe ASCII (no Devanagari) to find the section
const OLD_MARKER_START = '            <div className="col-12">\n              <label className="me-4 user-select-none" style={{ cursor: \'pointer\' }}>\n                <input type="checkbox" className="me-1" checked={emd}'
const NEW_SECTION =
  '            <div className="col-12">\n' +
  '              <div style={{ display: \'flex\', alignItems: \'center\', gap: 12, flexWrap: \'wrap\', padding: \'10px 14px\', background: emd ? \'#f0f7ff\' : \'#fafbfc\', borderRadius: 8, border: \'1.5px solid #c8d8e8\', marginBottom: 8 }}>\n' +
  '                <label style={{ display: \'flex\', alignItems: \'center\', gap: 6, cursor: \'pointer\', minWidth: 180, margin: 0, userSelect: \'none\' }}>\n' +
  '                  <input type="checkbox" checked={emd} onChange={e => setEmd(e.target.checked)} />\n' +
  '                  <span style={{ fontWeight: 600, fontSize: \'0.88rem\', color: \'#1a3a5c\', marginLeft: 4 }}>{mr ? \'EMD (\u092c\u092f\u093e\u0928\u093e)\' : \'EMD (Earnest Money)\'}</span>\n' +
  '                </label>\n' +
  '                {emd && (\n' +
  '                  <>\n' +
  '                    <div style={{ display: \'flex\', alignItems: \'center\', gap: 4 }}>\n' +
  '                      <input type="number" style={{ width: 72, border: \'1.5px solid #c8d8e8\', borderRadius: 8, padding: \'6px 10px\', fontSize: \'0.88rem\', color: \'#18324a\', background: \'#fff\', outline: \'none\' }}\n' +
  '                        value={emdPct} min={0} max={100} step={0.5} onChange={e => setEmdPct(parseFloat(e.target.value) || 0)} />\n' +
  '                      <span style={{ color: \'#5e7388\', fontWeight: 600, fontSize: \'0.88rem\' }}>%</span>\n' +
  '                    </div>\n' +
  '                    <span style={{ color: \'#aab\', fontSize: \'1rem\' }}>\u2192</span>\n' +
  '                    <span style={{ fontWeight: 700, color: \'#1a6db5\', fontSize: \'0.92rem\' }}>\u20b9{fmtINR(emdAmt)}</span>\n' +
  '                  </>\n' +
  '                )}\n' +
  '              </div>\n' +
  '              <div style={{ display: \'flex\', alignItems: \'center\', gap: 12, flexWrap: \'wrap\', padding: \'10px 14px\', background: deposit ? \'#f0f7ff\' : \'#fafbfc\', borderRadius: 8, border: \'1.5px solid #c8d8e8\' }}>\n' +
  '                <label style={{ display: \'flex\', alignItems: \'center\', gap: 6, cursor: \'pointer\', minWidth: 180, margin: 0, userSelect: \'none\' }}>\n' +
  '                  <input type="checkbox" checked={deposit} onChange={e => setDeposit(e.target.checked)} />\n' +
  '                  <span style={{ fontWeight: 600, fontSize: \'0.88rem\', color: \'#1a3a5c\', marginLeft: 4 }}>{mr ? \'\u0905\u0928\u093e\u092e\u0924 \u0930\u0915\u094d\u0915\u092e\' : \'Security Deposit\'}</span>\n' +
  '                </label>\n' +
  '                {deposit && (\n' +
  '                  <>\n' +
  '                    <div style={{ display: \'flex\', alignItems: \'center\', gap: 4 }}>\n' +
  '                      <input type="number" style={{ width: 72, border: \'1.5px solid #c8d8e8\', borderRadius: 8, padding: \'6px 10px\', fontSize: \'0.88rem\', color: \'#18324a\', background: \'#fff\', outline: \'none\' }}\n' +
  '                        value={depositPct} min={0} max={100} step={0.5} onChange={e => setDepositPct(parseFloat(e.target.value) || 0)} />\n' +
  '                      <span style={{ color: \'#5e7388\', fontWeight: 600, fontSize: \'0.88rem\' }}>%</span>\n' +
  '                    </div>\n' +
  '                    <span style={{ color: \'#aab\', fontSize: \'1rem\' }}>\u2192</span>\n' +
  '                    <span style={{ fontWeight: 700, color: \'#1a6db5\', fontSize: \'0.92rem\' }}>\u20b9{fmtINR(depositAmt)}</span>\n' +
  '                  </>\n' +
  '                )}\n' +
  '              </div>\n' +
  '            </div>'

// Find and replace the old checkbox section by matching the unique start pattern
const startIdx = src.indexOf(OLD_MARKER_START)
if (startIdx === -1) {
  console.error('ERROR: Could not find old checkbox section. Aborting.')
  process.exit(1)
}

// Find the closing </div> that ends this col-12 div
// The section ends with: '            </div>' after the second label closes
const SECTION_END = '            </div>\n          </div>\n\n          <div className="d-flex justify-content-end'
const endIdx = src.indexOf(SECTION_END, startIdx)
if (endIdx === -1) {
  console.error('ERROR: Could not find end of checkbox section. Aborting.')
  process.exit(1)
}

// The old section is from startIdx to (endIdx + length of the col-12 closing div)
const OLD_SECTION_END = '            </div>'
const oldSectionEnd = src.indexOf(OLD_SECTION_END, startIdx)
// We need the THIRD occurrence of '            </div>' (col-12 close, after 2 label closes)
// Safer: find just before the '\n          </div>' that closes the row g-3
const rowCloseIdx = src.indexOf('\n          </div>\n\n          <div className="d-flex', startIdx)
const oldEndFull = rowCloseIdx // old section ends here

src = src.slice(0, startIdx) + NEW_SECTION + src.slice(oldEndFull)

writeFileSync(pagePath, src, 'utf8')
console.log('Done! EMD/Security Deposit fields updated in page.tsx.')
