import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'दस्तएवज सत्यापित | SMKMC',
}

export default async function VerifySamajPage({
  searchParams,
}: {
  searchParams: Promise<{ no?: string; dept?: string; fy?: string }>
}) {
  const params = await searchParams
  const no   = params.no   ?? ''
  const dept = params.dept ?? ''
  const fy   = params.fy   ?? ''
  const isValid = !!(no && dept && fy)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#e8f5e9 0%,#f1f8e9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Noto Sans','Arial Unicode MS',Arial,sans-serif",
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '36px 40px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        {isValid ? (
          <>
            {/* Green check */}
            <div style={{ fontSize: 64, color: '#2e7d32', lineHeight: 1 }}>&#10004;</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2e7d32', margin: '12px 0 4px' }}>
              दस्तएवज सत्यापित
            </h1>
            <p style={{ color: '#555', margin: '0 0 24px', fontSize: '1rem' }}>
              Document Verified &mdash; SMKMC
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', textAlign: 'left' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '10px 8px', color: '#666', width: '40%' }}>दस्तएवज प्रकार</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>निविदा मंजूरीची समज</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '10px 8px', color: '#666' }}>विभाग</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{dept}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '10px 8px', color: '#666' }}>क्रमांक</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{no}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 8px', color: '#666' }}>आर्थिक वर्ष</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{fy}</td>
                </tr>
              </tbody>
            </table>

            <div style={{
              marginTop: 24,
              padding: '10px 16px',
              background: '#e8f5e9',
              borderRadius: 8,
              color: '#2e7d32',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}>
              हे दस्तएवज अधिकृत आहे
            </div>

            <p style={{ marginTop: 20, color: '#888', fontSize: '0.85rem' }}>
              सांगली मिरज आणि कुपवाड शहर महानगरपालिका
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, color: '#c62828', lineHeight: 1 }}>&#10006;</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c62828', margin: '12px 0 8px' }}>
              अवैध क्रमांक
            </h1>
            <p style={{ color: '#555' }}>स्कॅन कोड मान्य नाही</p>
          </>
        )}
      </div>
    </div>
  )
}
