import { readFileSync, writeFileSync } from 'fs';

const filePath = String.raw`c:\Users\ACER\source\repos\SMKC-ERP\smkc-erp\apps\smkc-erp-shell\app\general-administration\create-samaj\print\page.tsx`;
let c = readFileSync(filePath, 'utf-8');

const D = {
  adhikrut: '\u0905\u0927\u093f\u0915\u0943\u0924 \u0905\u0927\u093f\u0915\u093e\u0930\u0940',
  smkmc:    '\u0938\u093e\u0902\u0917\u0932\u0940 \u092e\u093f\u0930\u091c \u0906\u0923\u093f \u0915\u0941\u092a\u0935\u093e\u0921 \u0936\u0939\u0930 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u093e',
  scan:     '\u0938\u094d\u0915\u0945\u0928 \u0915\u0930\u093e - \u092a\u0921\u0924\u093e\u0933\u093e',
};

const SIGN_START = '        {/* Bottom: Signature (left) + QR Code (center) */}';
const PAGE_END   = '\n\n\n      </div>';

const si = c.indexOf(SIGN_START);
const pe = c.indexOf(PAGE_END, si);

if (si === -1 || pe === -1) {
  console.error('ERROR: markers not found (si=%d pe=%d)', si, pe);
  process.exit(1);
}

// Order: empty spacer (col 1) | QR (col 2, center) | Signature (col 3, right)
const newJsx = `        {/* Bottom: QR Code (center) + Signature (right) */}
        <div className="bottom-row">
          {/* Col 1: empty spacer keeps QR centred */}
          <div />
          {/* Col 2 (center): QR Code */}
          <div className="qr-col">
            {qrUrl && (
              <QRCodeSVG value={qrUrl} size={90} level="M" marginSize={0} />
            )}
            <div style={{ marginTop: 3, fontSize: '8pt', color: '#555', textAlign: 'center' }}>
              ${D.scan}
            </div>
          </div>
          {/* Col 3 (right): Signature */}
          <div className="sign-col">
            <div style={{ height: 52, borderBottom: '1px solid #555', marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: '12pt' }}>
              {data.signingOfficerName || '${D.adhikrut}'}
            </div>
            {data.signingOfficerDesignation && (
              <div style={{ fontSize: '10.5pt', marginTop: 2 }}>
                {data.signingOfficerDesignation}
              </div>
            )}
            {data.deptName && (
              <div style={{ fontSize: '10.5pt', marginTop: 2 }}>
                {data.deptName}
              </div>
            )}
            <div style={{ fontSize: '10.5pt', marginTop: 2 }}>
              ${D.smkmc}
            </div>
          </div>
        </div>`;

c = c.substring(0, si) + newJsx + c.substring(pe);
writeFileSync(filePath, c, 'utf-8');
console.log('Done — layout updated: spacer | QR center | signature right');
