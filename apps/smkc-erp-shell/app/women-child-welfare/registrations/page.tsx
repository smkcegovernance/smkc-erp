'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { DEPARTMENTS } from '@smkc/types'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import {
  listRegistrations,
  updateRegistrationStatus,
  getRegistration,
} from '../services/api'
import type { RegistrationSummary, ApiResponse } from '../types/formTypes'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'ALL',          label: 'सर्व' },
  { key: 'SUBMITTED',    label: 'नवीन' },
  { key: 'UNDER_REVIEW', label: 'आढाव्याधीन' },
  { key: 'APPROVED',     label: 'मंजूर' },
  { key: 'REJECTED',     label: 'नाकारले' },
]

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  SUBMITTED:    { label: 'नवीन',          bg: '#0f5fa8',  color: '#fff' },
  UNDER_REVIEW: { label: 'आढाव्याधीन',   bg: '#d97706',  color: '#fff' },
  APPROVED:     { label: 'मंजूर',         bg: '#117a5d',  color: '#fff' },
  REJECTED:     { label: 'नाकारले',       bg: '#c63b31',  color: '#fff' },
  CANCELLED:    { label: 'रद्द',          bg: '#6c757d',  color: '#fff' },
  DRAFT:        { label: 'ड्राफ्ट',      bg: '#6c757d',  color: '#fff' },
}

const DOC_LABELS: Record<string, string> = {
  PHOTO_DOC:            'फोटो',
  AADHAAR_DOC:          'आधार कार्ड',
  UDID_DOC:             'UDID दस्तऐवज',
  BANK_DOC:             'बँक दस्तऐवज',
  APPLICANT_SIGNATURE:  'अर्जदाराची सही',
  SURVEYOR_SIGNATURE:   'सर्वेक्षकाची सही',
}

const MODE_META: Record<string, { label: string; bg: string }> = {
  PUBLIC:     { label: 'सार्वजनिक',   bg: '#e8f4fd' },
  DEPARTMENT: { label: 'विभाग',       bg: '#fef3e2' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fullName(r: RegistrationSummary): string {
  return [r.SURNAME, r.FIRST_NAME].filter(Boolean).join(' ')
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('mr-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function maskAadhaar(aadhaar?: string): string {
  if (!aadhaar || aadhaar.length < 4) return '—'
  return 'XXXX-XXXX-' + aadhaar.slice(-4)
}

function formatFileSize(bytes?: unknown): string {
  const n = Number(bytes)
  if (!n || isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function docDownloadUrl(registrationNo: string, docCode: string, fileName: string, inline = false): string {
  return `/api/women-child-welfare/documents/download?registrationNumber=${encodeURIComponent(registrationNo)}&documentCode=${encodeURIComponent(docCode)}&fileName=${encodeURIComponent(fileName)}&inline=${inline}`
}

/** Normalize all keys to UPPERCASE so the component always sees REGISTRATION_NO etc.
 * regardless of how the .NET CamelCasePropertyNamesContractResolver transformed them.
 */
function normalizeRow(item: unknown): RegistrationSummary {
  const row = item as Record<string, unknown>
  const normalized: Record<string, unknown> = {}
  for (const k of Object.keys(row)) {
    normalized[k.toUpperCase()] = row[k]
  }
  return normalized as unknown as RegistrationSummary
}

function extractList(res: ApiResponse): RegistrationSummary[] {
  if (!res.success || !res.data) return []
  if (Array.isArray(res.data)) return (res.data as unknown[]).map(normalizeRow)
  const obj = res.data as Record<string, unknown>
  const arrKey = Object.keys(obj).find(k => Array.isArray(obj[k]))
  return arrKey ? (obj[arrKey] as unknown[]).map(normalizeRow) : []
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, bg: '#6c757d', color: '#fff' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.02em',
      background: meta.bg, color: meta.color,
    }}>
      {meta.label}
    </span>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  const meta = MODE_META[mode] ?? { label: mode, bg: '#f0f0f0' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 14,
      fontSize: '0.72rem', fontWeight: 500, background: meta.bg, color: '#374151',
      border: '1px solid rgba(0,0,0,0.08)',
    }}>
      {meta.label}
    </span>
  )
}

// ─── Reject Modal ────────────────────────────────────────────────────────────

interface RejectModalProps {
  target: RegistrationSummary
  onCancel: () => void
  onConfirm: (reason: string) => void
  submitting: boolean
}

function RejectModal({ target, onCancel, onConfirm, submitting }: RejectModalProps) {
  const [reason, setReason] = useState('')

  return (
    <div style={OVERLAY_STYLE} onClick={onCancel}>
      <div style={{ ...MODAL_STYLE, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={MODAL_HEADER_STYLE}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#c63b31' }}>
            <i className="bi bi-x-octagon-fill me-2" />नोंदणी नाकारा
          </h4>
          <button type="button" style={CLOSE_BTN_STYLE} onClick={onCancel} disabled={submitting}
            aria-label="बंद करा">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div style={{ padding: '18px 22px 0' }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: '#5e7388' }}>
            नोंदणी क्र.: <strong style={{ color: '#18324a' }}>{target.REGISTRATION_NO}</strong>
            {' — '}{fullName(target)}
          </p>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem', color: '#18324a' }}>
            नाकारण्याचे कारण <span style={{ color: '#c63b31' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="कारण लिहा... (किमान 10 अक्षरे आवश्यक)"
            disabled={submitting}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, resize: 'vertical',
              border: '1.5px solid #d5e1ea', fontSize: '0.92rem', fontFamily: 'inherit',
              color: '#18324a', outline: 'none',
            }}
          />
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#5e7388', textAlign: 'right' }}>
            {reason.length}/500
          </p>
        </div>
        <div style={{ padding: '14px 22px 18px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}
            disabled={submitting}>
            रद्द करा
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: '#c63b31', color: '#fff', border: 'none', minWidth: 100 }}
            disabled={submitting || reason.trim().length < 10}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-1" role="status" />थांबा...</>
              : <><i className="bi bi-x-circle me-1" />नाकारा</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  summary: RegistrationSummary
  detail: ApiResponse | null
  loading: boolean
  onClose: () => void
}

function DetailModal({ summary, detail, loading, onClose }: DetailModalProps) {
  const reg = useMemo(() => {
    if (!detail?.data) return null
    const data = detail.data as Record<string, unknown>
    const rows = (data['registration'] ?? data['Registration']) as Record<string, unknown>[] | undefined
    if (!rows?.[0]) return null
    // normalize keys to uppercase
    const row: Record<string, unknown> = {}
    for (const k of Object.keys(rows[0])) row[k.toUpperCase()] = rows[0][k]
    return row
  }, [detail])

  const disabilities = useMemo(() => {
    if (!detail?.data) return []
    const data = detail.data as Record<string, unknown>
    const rows = (data['disabilities'] ?? data['Disabilities'] ?? []) as Record<string, unknown>[]
    return rows.map(r => { const n: Record<string, unknown> = {}; for (const k of Object.keys(r)) n[k.toUpperCase()] = r[k]; return n })
  }, [detail])

  const devices = useMemo(() => {
    if (!detail?.data) return []
    const data = detail.data as Record<string, unknown>
    const rows = (data['devices'] ?? data['Devices'] ?? []) as Record<string, unknown>[]
    return rows.map(r => { const n: Record<string, unknown> = {}; for (const k of Object.keys(r)) n[k.toUpperCase()] = r[k]; return n })
  }, [detail])

  const documents = useMemo(() => {
    if (!detail?.data) return []
    const data = detail.data as Record<string, unknown>
    const rows = (data['documents'] ?? data['Documents'] ?? []) as Record<string, unknown>[]
    return rows.map(r => { const n: Record<string, unknown> = {}; for (const k of Object.keys(r)) n[k.toUpperCase()] = r[k]; return n })
  }, [detail])

  function field(key: string): string {
    if (!reg) return '—'
    const val = reg[key]
    return val != null && val !== '' ? String(val) : '—'
  }

  return (
    <div style={OVERLAY_STYLE} onClick={onClose}>
      <div
        style={{
          ...MODAL_STYLE,
          maxWidth: 760, maxHeight: '90vh', overflowY: 'auto',
          padding: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #e0eaf2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f5fa8 0%, #0b457c 100%)',
          borderRadius: '16px 16px 0 0', color: '#fff',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginBottom: 2 }}>
              नोंदणी तपशील
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              {summary.REGISTRATION_NO}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge status={summary.STATUS} />
            <button type="button" style={{ ...CLOSE_BTN_STYLE, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={onClose} aria-label="बंद करा">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#5e7388' }}>
              <div className="spinner-border text-primary mb-3" role="status" />
              <p>तपशील लोड होत आहे...</p>
            </div>
          )}

          {!loading && !reg && (
            <p style={{ color: '#5e7388', textAlign: 'center', padding: '24px 0' }}>
              तपशील उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.
            </p>
          )}

          {!loading && reg && (
            <>
              {/* Status Remarks (for rejected) */}
              {summary.STATUS === 'REJECTED' && summary.STATUS_REMARKS && (
                <div style={{
                  padding: '12px 16px', borderRadius: 10, marginBottom: 18,
                  background: '#fff5f5', border: '1.5px solid #f5c2c7', color: '#c63b31',
                }}>
                  <strong><i className="bi bi-exclamation-triangle-fill me-2" />नाकारण्याचे कारण:</strong>
                  <p style={{ margin: '6px 0 0', color: '#7a2020' }}>{summary.STATUS_REMARKS}</p>
                </div>
              )}

              {/* Personal */}
              <DetailSection title="वैयक्तिक माहिती" icon="bi-person-fill">
                <DetailRow label="नाव" value={`${field('SURNAME')} ${field('FIRST_NAME')}`} />
                <DetailRow label="वडिलांचे नाव" value={field('FATHER_NAME')} />
                <DetailRow label="आईचे नाव" value={field('MOTHER_NAME')} />
                <DetailRow label="जन्मतारीख" value={formatDate(field('DOB'))} />
                <DetailRow label="आधार क्र." value={maskAadhaar(field('AADHAAR_NUMBER'))} />
                <DetailRow label="मोबाइल" value={field('MOBILE_NUMBER')} />
                <DetailRow label="शिक्षण" value={field('EDUCATION')} />
                <DetailRow label="वैवाहिक स्थिती" value={field('MARITAL_STATUS')} />
              </DetailSection>

              {/* Address */}
              <DetailSection title="पत्ता व संपर्क" icon="bi-geo-alt-fill">
                <DetailRow label="पूर्ण पत्ता" value={field('FULL_ADDRESS')} wide />
                <DetailRow label="वॉर्ड" value={field('WARD_NUMBER')} />
                <DetailRow label="प्रभाग समिती" value={field('PRABHAG_SAMITI')} />
                <DetailRow label="पिनकोड" value={field('PINCODE')} />
                <DetailRow label="मतदारसंघ" value={field('CONSTITUENCY')} />
                <DetailRow label="पर्यायी फोन" value={field('ALTERNATE_PHONE')} />
              </DetailSection>

              {/* Disability */}
              <DetailSection title="अपंगत्व माहिती" icon="bi-heart-pulse-fill">
                <DetailRow label="अपंगत्व %" value={field('DISABILITY_PERCENTAGE') !== '—' ? `${field('DISABILITY_PERCENTAGE')}%` : '—'} />
                <DetailRow label="प्रमाणपत्र" value={field('HAS_CERTIFICATE') === 'Y' ? `होय — ${field('CERTIFICATE_NUMBER')}` : 'नाही'} />
                <DetailRow label="UDID" value={field('HAS_UDID') === 'Y' ? `होय — ${field('UDID_NUMBER')}` : 'नाही'} />
                {disabilities.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: '#5e7388', fontWeight: 600 }}>अपंगत्वाचे प्रकार:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {disabilities.map((d, i) => (
                        <span key={i} style={{
                          padding: '3px 10px', borderRadius: 14,
                          background: '#d9ecfb', color: '#0b457c',
                          fontSize: '0.78rem', fontWeight: 500,
                        }}>
                          {String(d['DISABILITY_TYPE_NAME'] ?? d['MARATHI_NAME'] ?? d['DISABILITY_NAME'] ?? '?')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {devices.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: '#5e7388', fontWeight: 600 }}>साहाय्यक साधने:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {devices.map((d, i) => (
                        <span key={i} style={{
                          padding: '3px 10px', borderRadius: 14,
                          background: '#d9f4ec', color: '#0a5240',
                          fontSize: '0.78rem', fontWeight: 500,
                        }}>
                          {String(d['DEVICE_NAME'] ?? d['MARATHI_NAME'] ?? d['ASSISTIVE_DEVICE_NAME'] ?? '?')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </DetailSection>

              {/* Bank */}
              {field('BANK_NAME') !== '—' && (
                <DetailSection title="बँक तपशील" icon="bi-bank2">
                  <DetailRow label="बँकेचे नाव" value={field('BANK_NAME')} />
                  <DetailRow label="शाखा" value={field('BRANCH_NAME')} />
                  <DetailRow label="खाते क्र." value={field('ACCOUNT_NUMBER')} />
                  <DetailRow label="IFSC" value={field('IFSC_CODE')} />
                </DetailSection>
              )}

              {/* Submission */}
              <DetailSection title="सादरीकरण माहिती" icon="bi-file-earmark-check-fill">
                <DetailRow label="अर्ज मोड" value={summary.APPLICATION_MODE === 'PUBLIC' ? 'सार्वजनिक' : 'विभाग'} />
                <DetailRow label="सादर केले" value={formatDate(summary.CREATED_AT)} />
                <DetailRow label="अद्यतनित" value={formatDate(summary.UPDATED_AT)} />
                {summary.REVIEWED_AT && <DetailRow label="आढावा दिनांक" value={formatDate(summary.REVIEWED_AT)} />}
                {summary.OPERATOR_NAME && <DetailRow label="ऑपरेटर" value={summary.OPERATOR_NAME} />}
              </DetailSection>

              {/* Documents & Images */}
              {documents.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h6 style={{
                    margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#0f5fa8', display: 'flex', alignItems: 'center', gap: 6,
                    paddingBottom: 6, borderBottom: '1.5px solid #d9ecfb',
                  }}>
                    <i className="bi bi-paperclip" />
                    दस्तऐवज व छायाचित्रे
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 12 }}>
                    {documents.map((doc, i) => {
                      const code = String(doc['DOCUMENT_CODE'] ?? '')
                      const fileName = String(doc['FILE_NAME'] ?? '')
                      const mimeType = String(doc['MIME_TYPE'] ?? '')
                      const fileSize = doc['FILE_SIZE'] as number | null | undefined
                      const label = DOC_LABELS[code] ?? code
                      const isImage = mimeType.startsWith('image/')
                      const inlineUrl = docDownloadUrl(summary.REGISTRATION_NO, code, fileName, true)
                      const downloadUrl = docDownloadUrl(summary.REGISTRATION_NO, code, fileName, false)
                      return (
                        <div key={i} style={{
                          border: '1.5px solid #d5e1ea', borderRadius: 10, overflow: 'hidden',
                          background: '#fafcff', display: 'flex', flexDirection: 'column',
                        }}>
                          {/* Preview area */}
                          <div style={{
                            height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#f0f5fa', overflow: 'hidden', position: 'relative',
                          }}>
                            {isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={inlineUrl}
                                alt={label}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <i className="bi bi-file-earmark-text" style={{ fontSize: '2.4rem', color: '#5e7388', opacity: 0.6 }} />
                            )}
                          </div>
                          {/* Info + download */}
                          <div style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#18324a', marginBottom: 2 }}>
                              {label}
                            </div>
                            {fileSize && (
                              <div style={{ fontSize: '0.72rem', color: '#5e7388', marginBottom: 6 }}>
                                {formatFileSize(fileSize)}
                              </div>
                            )}
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={fileName || undefined}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 10px', borderRadius: 7,
                                background: '#e8f4fd', color: '#0f5fa8',
                                fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none',
                                border: '1px solid #b3d4f0',
                              }}
                            >
                              <i className="bi bi-download" />
                              डाउनलोड
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailSection({
  title, icon, children,
}: {
  title: string; icon: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h6 style={{
        margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: '#0f5fa8', display: 'flex', alignItems: 'center', gap: 6,
        paddingBottom: 6, borderBottom: '1.5px solid #d9ecfb',
      }}>
        <i className={`bi ${icon}`} />
        {title}
      </h6>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function DetailRow({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '0.75rem', color: '#5e7388', display: 'block', marginBottom: 1 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: '#18324a', fontWeight: 500, wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1050,
  background: 'rgba(18, 49, 76, 0.55)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '16px',
}

const MODAL_STYLE: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 24px 60px rgba(18,49,76,0.22)',
  width: '100%',
}

const MODAL_HEADER_STYLE: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid #e0eaf2',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}

const CLOSE_BTN_STYLE: React.CSSProperties = {
  background: 'none', border: '1px solid #d5e1ea', borderRadius: 8,
  padding: '4px 8px', cursor: 'pointer', color: '#5e7388', fontSize: '0.9rem',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegistrationsPage() {
  const dept = DEPARTMENTS.find((d) => d.key === 'women-child-welfare')!
  const { T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Popup (success / error)
  const [popup, setPopup] = useState<{
    open: boolean; tone: 'success' | 'error' | 'warning'; title: string; description: string
  }>({ open: false, tone: 'info' as never, title: '', description: '' })

  // Approve confirm
  const [approveTarget, setApproveTarget] = useState<RegistrationSummary | null>(null)

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<RegistrationSummary | null>(null)
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  // Detail modal
  const [detailTarget, setDetailTarget] = useState<RegistrationSummary | null>(null)
  const [detailData, setDetailData] = useState<ApiResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Action in-progress tracker (by reg no)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // ── Load registrations ──────────────────────────────────────────────────

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    const res = await listRegistrations()
    if (res.success) {
      setRegistrations(extractList(res))
    } else {
      setPopup({
        open: true,
        tone: res.errorCode === 'SERVER_UNREACHABLE' || res.errorCode === 'GATEWAY_TIMEOUT'
          ? 'warning' : 'error',
        title: 'नोंदणी यादी मिळाली नाही',
        description: res.message ?? 'यादी लोड करताना त्रुटी आली.',
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadRegistrations() }, [loadRegistrations, refreshKey])

  // ── Derived lists ────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: registrations.length }
    for (const r of registrations) {
      map[r.STATUS] = (map[r.STATUS] ?? 0) + 1
    }
    return map
  }, [registrations])

  const filtered = useMemo(() => {
    let list = registrations
    if (activeTab !== 'ALL') list = list.filter(r => r.STATUS === activeTab)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(r =>
        r.REGISTRATION_NO.toLowerCase().includes(q) ||
        fullName(r).toLowerCase().includes(q) ||
        r.MOBILE_NUMBER.includes(q) ||
        (r.AADHAAR_NUMBER ?? '').slice(-4).includes(q)
      )
    }
    return list
  }, [registrations, activeTab, searchQuery])

  // ── Status action helpers ─────────────────────────────────────────────────

  async function performStatusUpdate(
    target: RegistrationSummary,
    status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    remarks?: string
  ) {
    setActionInProgress(target.REGISTRATION_NO)
    const res = await updateRegistrationStatus(target.REGISTRATION_NO, status, remarks)
    setActionInProgress(null)

    if (res.success) {
      setPopup({
        open: true,
        tone: 'success',
        title: 'स्थिती अद्यतनित झाली',
        description:
          status === 'APPROVED'     ? `${fullName(target)} — नोंदणी मंजूर झाली.`
          : status === 'REJECTED'   ? `${fullName(target)} — नोंदणी नाकारली.`
          : `${fullName(target)} — आढाव्याधीन केले.`,
      })
      // Update local state immediately (optimistic-like)
      setRegistrations(prev =>
        prev.map(r =>
          r.REGISTRATION_NO === target.REGISTRATION_NO
            ? { ...r, STATUS: status, STATUS_REMARKS: remarks ?? r.STATUS_REMARKS }
            : r
        )
      )
    } else {
      const isNetworkIssue =
        res.errorCode === 'SERVER_UNREACHABLE' || res.errorCode === 'GATEWAY_TIMEOUT'
      setPopup({
        open: true,
        tone: isNetworkIssue ? 'warning' : 'error',
        title: isNetworkIssue ? 'नेटवर्क समस्या' : 'स्थिती बदलता आली नाही',
        description: res.message ?? 'स्थिती अद्यतन करताना त्रुटी आली.',
      })
    }
  }

  function handleUnderReview(r: RegistrationSummary) {
    performStatusUpdate(r, 'UNDER_REVIEW')
  }

  function handleApprove(r: RegistrationSummary) {
    setApproveTarget(r)
  }

  function handleRejectOpen(r: RegistrationSummary) {
    setRejectTarget(r)
  }

  async function handleRejectConfirm(reason: string) {
    if (!rejectTarget) return
    setRejectSubmitting(true)
    await performStatusUpdate(rejectTarget, 'REJECTED', reason)
    setRejectSubmitting(false)
    setRejectTarget(null)
  }

  async function handleApproveConfirm() {
    if (!approveTarget) return
    const t = approveTarget
    setApproveTarget(null)
    await performStatusUpdate(t, 'APPROVED')
  }

  // ── Detail view ───────────────────────────────────────────────────────────

  async function openDetail(r: RegistrationSummary) {
    setDetailTarget(r)
    setDetailData(null)
    setDetailLoading(true)
    const res = await getRegistration(r.REGISTRATION_NO)
    setDetailData(res)
    setDetailLoading(false)
  }

  // ── Action buttons ────────────────────────────────────────────────────────

  function ActionButtons({ r }: { r: RegistrationSummary }) {
    const busy = actionInProgress === r.REGISTRATION_NO
    const s = r.STATUS

    return (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {/* View */}
        <button
          type="button" title="तपशील पहा"
          className="btn btn-sm"
          style={{ padding: '4px 9px', fontSize: '0.8rem', background: '#eef4f8', border: '1px solid #d5e1ea', color: '#18324a' }}
          onClick={() => openDetail(r)}
        >
          <i className="bi bi-eye-fill" />
        </button>

        {/* Edit — available for all non-final statuses */}
        {s !== 'APPROVED' && s !== 'CANCELLED' && (
          <Link
            href={`/women-child-welfare/registrations/${encodeURIComponent(r.REGISTRATION_NO)}/edit`}
            title="माहिती संपादित करा"
            className="btn btn-sm"
            style={{ padding: '4px 9px', fontSize: '0.8rem', background: '#f0e8ff', border: '1px solid #c4a6f0', color: '#5b21b6', textDecoration: 'none' }}
          >
            <i className="bi bi-pencil-fill" />
          </Link>
        )}

        {/* Mark Under Review */}
        {(s === 'SUBMITTED' || s === 'DRAFT') && (
          <button
            type="button" title="आढाव्याधीन करा"
            className="btn btn-sm"
            style={{ padding: '4px 9px', fontSize: '0.8rem', background: '#fef3e2', border: '1px solid #f5d591', color: '#92400e' }}
            disabled={busy}
            onClick={() => handleUnderReview(r)}
          >
            {busy
              ? <span className="spinner-border spinner-border-sm" role="status" />
              : <i className="bi bi-arrow-clockwise" />}
          </button>
        )}

        {/* Approve */}
        {(s === 'SUBMITTED' || s === 'UNDER_REVIEW') && (
          <button
            type="button" title="मंजूर करा"
            className="btn btn-sm"
            style={{ padding: '4px 9px', fontSize: '0.8rem', background: '#d9f4ec', border: '1px solid #86d9be', color: '#0a5240' }}
            disabled={busy}
            onClick={() => handleApprove(r)}
          >
            {busy
              ? <span className="spinner-border spinner-border-sm" role="status" />
              : <i className="bi bi-check-circle-fill" />}
          </button>
        )}

        {/* Reject */}
        {(s === 'SUBMITTED' || s === 'UNDER_REVIEW') && (
          <button
            type="button" title="नाकारा"
            className="btn btn-sm"
            style={{ padding: '4px 9px', fontSize: '0.8rem', background: '#ffe5e1', border: '1px solid #f5a99a', color: '#7a2020' }}
            disabled={busy}
            onClick={() => handleRejectOpen(r)}
          >
            {busy
              ? <span className="spinner-border spinner-border-sm" role="status" />
              : <i className="bi bi-x-circle-fill" />}
          </button>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dept-layout">
      <DeptSidebar
        deptKey="women-child-welfare"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
      />

      <main className="erp-main">
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <Link href="/women-child-welfare/dashboard" className="dash-breadcrumb-home">
            {dept.label}
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <span className="dash-breadcrumb-current">दिव्यांग नोंदणी व्यवस्थापन</span>
        </nav>

        {/* Page header */}
        <div className="erp-page-header">
          <div className="erp-page-header-text">
            <div className="erp-page-kicker">Reports — Women &amp; Child Welfare</div>
            <h1 className="erp-page-title">
              <button
                type="button"
                className="dept-sidebar-toggle-btn"
                style={{ marginRight: 12 }}
                onClick={() => setSidebarOpen(v => !v)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} />
              </button>
              दिव्यांग नोंदणी व्यवस्थापन
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)', fontSize: '0.85rem',
              }} />
              <input
                type="text"
                placeholder="नाव, मोबाइल, नोंदणी क्र..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="dash-filter-input"
                style={{ paddingLeft: 30, minWidth: 220 }}
              />
            </div>
            <button
              type="button"
              className="dash-view-tab"
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
              style={{ gap: 6 }}
            >
              <i className="bi bi-arrow-clockwise" />
              ताजेतवाने
            </button>
            <Link
              href="/women-child-welfare"
              className="dash-view-tab"
              style={{ gap: 6, textDecoration: 'none' }}
            >
              <i className="bi bi-plus-circle" />
              नवीन नोंदणी
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <div className="dash-view-tabs" role="tablist" style={{ marginBottom: '1.5rem' }}>
          {STATUS_TABS.map(tab => {
            const count = counts[tab.key] ?? 0
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                type="button"
                className={`dash-view-tab${active ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    display: 'inline-block', marginLeft: 6, padding: '0 6px',
                    borderRadius: 10, fontSize: '0.7rem', fontWeight: 700,
                    background: active ? 'var(--brand-primary)' : 'var(--color-gray-200)',
                    color: active ? '#fff' : 'var(--color-text-muted)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Table card */}
        <div className="erp-card" style={{ overflow: 'hidden', padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <div className="spinner-border text-primary mb-3" role="status" />
              <p>नोंदणी यादी लोड होत आहे...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2.4rem', display: 'block', marginBottom: 10, opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>
                {searchQuery ? 'शोध परिणाम आढळले नाहीत.' : 'या स्थितीत कोणत्याही नोंदणी नाहीत.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-50)', borderBottom: '1.5px solid var(--surface-border)' }}>
                    {['नोंदणी क्र.', 'नाव', 'मोबाइल', 'अपंगत्व %', 'मोड', 'सादर दिनांक', 'स्थिती', 'कारवाई'].map(h => (
                      <th key={h} style={{
                        padding: '11px 14px', textAlign: 'left', fontWeight: 600,
                        color: 'var(--color-text-muted)', fontSize: '0.75rem',
                        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={r.REGISTRATION_NO ?? idx} style={{
                      borderBottom: '1px solid var(--surface-border)',
                      background: idx % 2 === 0 ? '#fff' : 'var(--color-gray-50)',
                    }}>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                          {r.REGISTRATION_NO}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-heading)' }}>{fullName(r)}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{r.FATHER_NAME}</div>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {r.MOBILE_NUMBER}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                        {r.DISABILITY_PERCENTAGE != null ? `${r.DISABILITY_PERCENTAGE}%` : '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <ModeBadge mode={r.APPLICATION_MODE} />
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {formatDate(r.CREATED_AT)}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <StatusBadge status={r.STATUS} />
                        {r.STATUS === 'REJECTED' && r.STATUS_REMARKS && (
                          <div
                            title={r.STATUS_REMARKS}
                            style={{ fontSize: '0.73rem', color: '#c63b31', marginTop: 3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {r.STATUS_REMARKS}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <ActionButtons r={r} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--surface-border)', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {filtered.length} नोंदणी दाखवत आहे
                {activeTab !== 'ALL' || searchQuery ? ` (एकूण ${registrations.length} पैकी)` : ''}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Approve confirmation popup ── */}
      {approveTarget && (
        <ErpPopup
          open
          tone="confirm"
          title="मंजुरी द्यायची?"
          description={`${approveTarget.REGISTRATION_NO} — ${fullName(approveTarget)} — या नोंदणीला मंजुरी देत आहात.`}
          actions={[
            { label: 'रद्द करा', onClick: () => setApproveTarget(null), variant: 'secondary' },
            { label: 'होय, मंजूर करा', onClick: handleApproveConfirm, variant: 'primary' },
          ]}
          onClose={() => setApproveTarget(null)}
        />
      )}

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <RejectModal
          target={rejectTarget}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          submitting={rejectSubmitting}
        />
      )}

      {/* ── Detail modal ── */}
      {detailTarget && (
        <DetailModal
          summary={detailTarget}
          detail={detailData}
          loading={detailLoading}
          onClose={() => { setDetailTarget(null); setDetailData(null) }}
        />
      )}

      {/* ── Result popup ── */}
      <ErpPopup
        open={popup.open}
        tone={popup.tone}
        title={popup.title}
        description={popup.description}
        onClose={() => setPopup(p => ({ ...p, open: false }))}
      />
    </div>
  )
}
