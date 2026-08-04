'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getRegistration } from '../../../services/api'
import type { ApiResponse } from '../../../types/formTypes'

const DOC_LABELS: Record<string, string> = {
  PHOTO_DOC: 'फोटो',
  AADHAAR_DOC: 'आधार कार्ड',
  RATION_CARD_DOC: 'रेशन कार्ड',
  UDID_DOC: 'UDID दस्तऐवज',
  BANK_DOC: 'बँक दस्तऐवज',
  INCOME_CERTIFICATE_DOC: 'उत्पन्न दाखला',
  APPLICANT_SIGNATURE: 'अर्जदाराची सही',
  SURVEYOR_SIGNATURE: 'सर्वेक्षकाची सही',
}

function formatDate(value: unknown): string {
  const s = String(value ?? '')
  if (!s) return '—'
  const parsed = new Date(s)
  if (Number.isNaN(parsed.getTime())) return s
  return new Intl.DateTimeFormat('mr-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function normalizeRow(item: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const key of Object.keys(item)) normalized[key.toUpperCase()] = item[key]
  return normalized
}

function asList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(v => !!v && typeof v === 'object')
    .map(v => normalizeRow(v as Record<string, unknown>))
}

function docDownloadUrl(registrationNo: string, docCode: string, fileName: string, inline = false): string {
  return `/api/women-child-welfare/documents/download?registrationNumber=${encodeURIComponent(registrationNo)}&documentCode=${encodeURIComponent(docCode)}&fileName=${encodeURIComponent(fileName)}&inline=${inline}`
}

export default function DepartmentPrintableFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const contentRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)

  const registrationNo = useMemo(() => {
    const raw = params?.id
    if (Array.isArray(raw)) return decodeURIComponent(raw[0] ?? '')
    return decodeURIComponent(raw ?? '')
  }, [params])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await getRegistration(registrationNo)
      if (!cancelled) {
        setResponse(result)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [registrationNo])

  const registration = useMemo(() => {
    const d = response?.data as Record<string, unknown> | undefined
    const rows = asList(d?.registration ?? d?.Registration)
    return rows[0] ?? null
  }, [response])

  const disabilities = useMemo(() => {
    const d = response?.data as Record<string, unknown> | undefined
    return asList(d?.disabilities ?? d?.Disabilities)
  }, [response])

  const devices = useMemo(() => {
    const d = response?.data as Record<string, unknown> | undefined
    return asList(d?.devices ?? d?.Devices)
  }, [response])

  const documents = useMemo(() => {
    const d = response?.data as Record<string, unknown> | undefined
    return asList(d?.documents ?? d?.Documents)
  }, [response])

  const applicantName = `${String(registration?.SURNAME ?? '').trim()} ${String(registration?.FIRST_NAME ?? '').trim()}`.trim() || '—'
  const documentCodes = useMemo(() => new Set(documents.map(d => String(d.DOCUMENT_CODE ?? ''))), [documents])

  function field(key: string): string {
    const value = registration?.[key]
    return value == null || value === '' ? '—' : String(value)
  }

  function joinList(rows: Record<string, unknown>[], key: string): string {
    const values = rows
      .map(r => String(r[key] ?? '').trim())
      .filter(Boolean)
    return values.length ? values.join(', ') : '—'
  }

  async function handleDownloadPdf() {
    if (!contentRef.current || !registration) return
    setIsDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default as any
      await html2pdf()
        .set({
          filename: `wcwc-form-${registrationNo}.pdf`,
          margin: [0, 0, 0, 0],
          image: { type: 'jpeg', quality: 0.9 },
          html2canvas: { scale: 1, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'] },
        })
        .from(contentRef.current)
        .save()
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (!registration || loading) return
    if (searchParams.get('download') !== '1') return

    const timer = window.setTimeout(() => {
      handleDownloadPdf()
    }, 350)

    return () => window.clearTimeout(timer)
  }, [registration, loading, searchParams])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>फॉर्म तपशील लोड होत आहे...</div>
  }

  if (!response?.success || !registration) {
    return (
      <div style={{ padding: '40px', maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 10 }}>फॉर्म तपशील उपलब्ध नाही</h2>
        <p style={{ color: '#5e7388' }}>{response?.message ?? 'नोंदणी तपशील सापडला नाही.'}</p>
        <Link href="/women-child-welfare/registrations" className="btn btn-outline-primary btn-sm">
          यादीकडे परत जा
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: '#f3f7fb', minHeight: '100vh', padding: '18px 14px' }}>
      <style jsx global>{`
        @media print {
          .toolbar-no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1040, margin: '0 auto 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#18324a' }}>WCWC Form Copy</h1>
          <p style={{ margin: '4px 0 0', color: '#5e7388', fontSize: '0.9rem' }}>
            नोंदणी क्र. {registrationNo} · विभाग पडताळणीसाठी प्रिंट स्वरूप
          </p>
        </div>
        <div className="toolbar-no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleDownloadPdf} disabled={isDownloading}>
            <i className="bi bi-download me-1" />{isDownloading ? 'डाउनलोड होत आहे...' : 'अर्ज डाउनलोड करा'}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" />Print
          </button>
          <Link href="/women-child-welfare/registrations" className="btn btn-outline-primary btn-sm">
            यादीकडे जा
          </Link>
        </div>
      </div>

      <div ref={contentRef} style={reportStyle}>
        <PageHeader registrationNo={field('REGISTRATION_NO')} applicantName={applicantName} submittedAt={formatDate(registration.CREATED_AT)} status={field('STATUS')} />

        <Section title="1) वैयक्तिक माहिती">
          <InfoRow label="आडनाव" value={field('SURNAME')} />
          <InfoRow label="नाव" value={field('FIRST_NAME')} />
          <InfoRow label="वडिलांचे नाव" value={field('FATHER_NAME')} />
          <InfoRow label="आईचे नाव" value={field('MOTHER_NAME')} />
          <InfoRow label="शिक्षण" value={field('EDUCATION')} />
          <InfoRow label="जन्मतारीख" value={formatDate(registration.DOB)} />
          <InfoRow label="आधार क्रमांक" value={field('AADHAAR_NUMBER')} />
          <InfoRow label="रेशन कार्ड क्रमांक" value={field('RATION_CARD_NUMBER')} />
          <InfoRow label="रेशन कार्ड रंग" value={field('RATION_CARD_COLOR')} />
          <InfoRow label="वैवाहिक स्थिती" value={field('MARITAL_STATUS')} />
          <InfoRow label="धर्म" value={field('RELIGION')} />
          <InfoRow label="जात" value={field('CASTE_NAME')} />
          <InfoRow label="कुटुंब प्रमुखाशी नाते" value={field('FAMILY_RELATION')} />
        </Section>

        <Section title="2) पत्ता व संपर्क">
          <InfoRow label="पूर्ण पत्ता" value={field('FULL_ADDRESS')} />
          <InfoRow label="महानगरपालिका क्षेत्र" value={field('LIVES_IN_CORPORATION_AREA')} />
          <InfoRow label="वॉर्ड" value={field('WARD_NUMBER')} />
          <InfoRow label="प्रभाग समिती" value={field('PRABHAG_SAMITI')} />
          <InfoRow label="UPHC" value={field('UPHC')} />
          <InfoRow label="पिनकोड" value={field('PINCODE')} />
          <InfoRow label="मतदारसंघ" value={field('CONSTITUENCY')} />
          <InfoRow label="मोबाईल" value={field('MOBILE_NUMBER')} />
          <InfoRow label="पर्यायी मोबाईल" value={field('ALTERNATE_PHONE')} />
          <InfoRow label="बँक" value={field('BANK_NAME')} />
          <InfoRow label="शाखा" value={field('BRANCH_NAME')} />
          <InfoRow label="खाते क्रमांक" value={field('ACCOUNT_NUMBER')} />
          <InfoRow label="IFSC" value={field('IFSC_CODE')} />
          <InfoRow label="BPL क्रमांक" value={field('BPL_NUMBER')} />
          <InfoRow label="BPL वर्ष" value={field('BPL_YEAR')} />
        </Section>

        <Section title="3) दिव्यांगत्व माहिती">
          <InfoRow label="प्रमाणपत्र" value={field('HAS_CERTIFICATE')} />
          <InfoRow label="प्रमाणपत्र क्रमांक" value={field('CERTIFICATE_NUMBER')} />
          <InfoRow label="प्रमाणपत्र दिनांक" value={formatDate(registration.CERTIFICATE_DATE)} />
          <InfoRow label="प्रमाणपत्र प्रकार" value={field('CERTIFICATE_TYPE')} />
          <InfoRow label="दिव्यांगत्व %" value={field('DISABILITY_PERCENTAGE')} />
          <InfoRow label="UDID" value={field('HAS_UDID')} />
          <InfoRow label="UDID क्रमांक" value={field('UDID_NUMBER')} />
          <InfoRow label="ST पास" value={field('HAS_ST_PASS')} />
          <InfoRow label="ST पास क्रमांक" value={field('ST_PASS_NUMBER')} />
          <InfoRow label="रेल्वे पास" value={field('HAS_RAILWAY_PASS')} />
          <InfoRow label="रेल्वे पास क्रमांक" value={field('RAILWAY_PASS_NUMBER')} />
          <InfoRow label="MSRTC पास" value={field('HAS_MSRTC_PASS')} />
          <InfoRow label="MSRTC पास क्रमांक" value={field('MSRTC_PASS_NUMBER')} />
          <InfoRow label="रोजगार" value={field('IS_EMPLOYED')} />
          <InfoRow label="रोजगार प्रकार" value={field('EMPLOYMENT_TYPE')} />
          <InfoRow label="व्यवसाय" value={field('OCCUPATION')} />
          <InfoRow label="अपंगत्व प्रकार" value={joinList(disabilities, 'DISABILITY_TYPE_NAME')} />
          <InfoRow label="साहाय्यक साधने" value={joinList(devices, 'DEVICE_NAME')} />
        </Section>

        <Section title="4) लाभ व पडताळणी माहिती">
          <InfoRow label="शासकीय लाभ" value={field('HAS_GOVT_BENEFIT')} />
          <InfoRow label="योजना तपशील" value={field('GOVT_BENEFIT_SCHEME')} />
          <InfoRow label="मनपा लाभ" value={field('HAS_MC_BENEFIT')} />
          <InfoRow label="मनपा लाभ तपशील" value={field('MC_BENEFIT_DETAILS')} />
          <InfoRow label="SGN पेन्शन" value={field('HAS_SGN_PENSION')} />
          <InfoRow label="स्वतःचे घर" value={field('HAS_OWN_HOUSE')} />
          <InfoRow label="घरकुल लाभ हवा" value={field('WANTS_HOUSING_BENEFIT')} />
          <InfoRow label="स्वतःची जागा" value={field('HAS_OWN_LAND')} />
          <InfoRow label="पालकत्व प्रमाणपत्र" value={field('HAS_GUARDIANSHIP')} />
          <InfoRow label="पालकाचे नाव" value={field('GUARDIAN_NAME')} />
          <InfoRow label="पालक पत्ता" value={field('GUARDIAN_ADDRESS')} />
          <InfoRow label="पालक फोन" value={field('GUARDIAN_PHONE')} />
          <InfoRow label="साहित्य आवश्यक" value={field('NEEDS_ASSISTIVE_DEVICE')} />
          <InfoRow label="कागदपत्रे सादर" value={field('DOCUMENTS_SUBMITTED')} />
          <InfoRow label="सही दिनांक" value={formatDate(registration.APPLICANT_SIGN_DATE)} />
          <InfoRow label="सर्वेक्षक नाव" value={field('SURVEYOR_NAME')} />
          <InfoRow label="सर्वेक्षक हुद्दा" value={field('SURVEYOR_DESIGNATION')} />
          <InfoRow label="सर्वेक्षक मोबाईल" value={field('SURVEYOR_MOBILE')} />
        </Section>

        <Section title="5) कागदपत्र चेकलिस्ट (Attached)">
          <InfoRow label="दिव्यांग प्रमाणपत्र / UDID" value={documentCodes.has('UDID_DOC') ? 'होय' : 'नाही'} />
          <InfoRow label="आधारकार्ड" value={documentCodes.has('AADHAAR_DOC') ? 'होय' : 'नाही'} />
          <InfoRow label="रेशनकार्ड" value={documentCodes.has('RATION_CARD_DOC') ? 'होय' : 'नाही'} />
          <InfoRow label="बँक दस्तऐवज" value={documentCodes.has('BANK_DOC') ? 'होय' : 'नाही'} />
          <InfoRow label="उत्पन्न दाखला" value={documentCodes.has('INCOME_CERTIFICATE_DOC') ? 'होय' : 'नाही'} />
          <InfoRow label="फोटो" value={documentCodes.has('PHOTO_DOC') ? 'होय' : 'नाही'} />
          <InfoRow label="अर्जदाराची सही" value={documentCodes.has('APPLICANT_SIGNATURE') ? 'होय' : 'नाही'} />
          <InfoRow label="सर्वेक्षक सही" value={documentCodes.has('SURVEYOR_SIGNATURE') ? 'होय' : 'नाही'} />
          <InfoRow label="एकूण जोडलेले दस्तऐवज" value={String(documents.length)} />
        </Section>
      </div>
    </div>
  )
}

function PageHeader({ registrationNo, applicantName, submittedAt, status }: { registrationNo: string; applicantName: string; submittedAt: string; status: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #d9ecfb',
      paddingBottom: 10,
      marginBottom: 14,
      gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/SMKC_NEW_LOGO_PNG.png" alt="SMKC Logo" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '1px solid #cfdce8' }} />
        <div>
          <div style={{ fontSize: '0.78rem', color: '#5e7388' }}>Sangli Miraj Kupwad City Municipal Corporation</div>
          <h2 style={{ margin: '2px 0 0', fontSize: '1.02rem', color: '#0f5fa8' }}>महिला व बाल कल्याण विभाग - दिव्यांग नोंदणी अर्ज</h2>
          <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#5e7388' }}>अर्जदार: {applicantName}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#18324a', minWidth: 180 }}>
        <div><strong>नोंदणी क्र.:</strong> {registrationNo}</div>
        <div><strong>स्थिती:</strong> {status}</div>
        <div><strong>सादर दिनांक:</strong> {submittedAt}</div>
      </div>
    </div>
  )
}

const reportStyle: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  background: '#fff',
  border: 'none',
  borderRadius: 0,
  margin: '0 auto',
  padding: '8mm',
  boxSizing: 'border-box',
  overflow: 'visible',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 10px', color: '#0f5fa8', borderBottom: '1px solid #d9ecfb', paddingBottom: 6 }}>
        {title}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '210px 1fr',
      gap: 8,
      borderBottom: '1px solid #edf2f7',
      padding: '5px 0',
      fontSize: '0.84rem',
    }}>
      <div style={{ color: '#4e6274', fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#18324a', wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  )
}
