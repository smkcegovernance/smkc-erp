'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './page.module.css'
import {
  getPrintableApplicationSnapshot,
  type PrintableApplicationSnapshot,
} from '../../../utils/printableApplication'

function formatDate(value: string) {
  if (!value) {
    return 'नोंद केलेले नाही'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

function renderValue(value: string | boolean | null | undefined) {
  if (typeof value === 'boolean') {
    return value ? 'होय' : 'नाही'
  }

  if (!value || value.trim().length === 0) {
    return 'नोंद केलेले नाही'
  }

  return value
}

function DetailField({ label, value, wide = false }: { label: string; value: string | boolean; wide?: boolean }) {
  return (
    <div className={wide ? styles.fieldWide : styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldValue}>{renderValue(value)}</div>
    </div>
  )
}

export default function PrintableApplicationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState<PrintableApplicationSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const registrationNumber = useMemo(() => {
    const value = params?.registrationNumber
    if (Array.isArray(value)) {
      return decodeURIComponent(value[0] ?? '')
    }

    return decodeURIComponent(value ?? '')
  }, [params])

  useEffect(() => {
    setSnapshot(getPrintableApplicationSnapshot(registrationNumber))
    setLoading(false)
  }, [registrationNumber])

  useEffect(() => {
    if (!snapshot || searchParams.get('autoprint') !== '1') {
      return
    }

    const timer = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(timer)
  }, [searchParams, snapshot])

  async function handleDownloadPdf() {
    if (!contentRef.current || !snapshot) {
      return
    }

    setIsDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default as any
      await html2pdf()
        .set({
          filename: `wcwc-application-${snapshot.registrationNumber}.pdf`,
          margin: 0,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(contentRef.current)
        .save()
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>A4 print copy तयार केली जात आहे...</div>
  }

  if (!snapshot) {
    return (
      <div className={styles.shell}>
        <div className={styles.emptyState}>
          <h2>Application copy सापडली नाही</h2>
          <p>
            या ब्राउझरमध्ये या अर्जाचा print snapshot उपलब्ध नाही. अर्ज पुन्हा सबमिट झाल्यानंतर याच स्क्रीनवरून
            Print / Save PDF वापरा.
          </p>
          <div className={styles.toolbarActions}>
            <Link className={styles.toolbarLink} href="/women-child-welfare/disability-registration">
              परत अर्ज फॉर्मकडे जा
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { formData } = snapshot

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <h1>Application Copy · A4 Print Layout</h1>
          <p>{snapshot.registrationNumber} · Browser print मध्ये Save as PDF वापरून soft copy जतन करता येईल.</p>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.toolbarButton} onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button type="button" className={styles.toolbarButton} onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <Link className={styles.toolbarLink} href="/women-child-welfare/disability-registration">
            Back to form
          </Link>
        </div>
      </div>

      <div ref={contentRef} className={styles.pages}>
        <section className={styles.page}>
          <header className={styles.pageHeader}>
            <div>
              <span className={styles.pageEyebrow}>Step 01</span>
              <h2>वैयक्तिक माहिती</h2>
              <p>अर्जदाराची ओळख, वैयक्तिक तपशील आणि मूलभूत प्रोफाइल माहिती.</p>
            </div>
            <div className={styles.metaCard}>
              <span>Application Number</span>
              <strong>{snapshot.registrationNumber}</strong>
              <small>Submitted on {formatDate(snapshot.submittedAt)}</small>
            </div>
          </header>

          <div className={styles.pageBody}>
            <div className={styles.heroBlock}>
              <div className={styles.photoFrame}>
                {formData.photoPreview ? <img src={formData.photoPreview} alt="Applicant" /> : <div className={styles.placeholder}>फोटो उपलब्ध नाही</div>}
              </div>
              <div className={styles.sectionGrid}>
                <DetailField label="आडनाव" value={formData.surname} />
                <DetailField label="नाव" value={formData.firstName} />
                <DetailField label="वडिलांचे नाव" value={formData.fatherName} />
                <DetailField label="आईचे नाव" value={formData.motherName} />
                <DetailField label="शिक्षण" value={formData.education} />
                <DetailField label="आधार क्रमांक" value={formData.aadhaarNumber} />
                <DetailField label="रेशन कार्ड क्रमांक" value={formData.rationCardNumber} />
                <DetailField label="रेशन कार्ड रंग" value={formData.rationCardColor} />
                <DetailField label="जन्मतारीख" value={formatDate(formData.dob)} />
                <DetailField label="वैवाहिक स्थिती" value={formData.maritalStatus} />
                <DetailField label="धर्म" value={formData.religion} />
                <DetailField label="जात" value={formData.caste} />
                <DetailField label="कौटुंबिक नाते" value={formData.familyRelation} wide />
              </div>
            </div>
          </div>

          <div className={styles.pageFooter}>Page 1 of 4</div>
        </section>

        <section className={styles.page}>
          <header className={styles.pageHeader}>
            <div>
              <span className={styles.pageEyebrow}>Step 02</span>
              <h2>पत्ता व संपर्क</h2>
              <p>निवास पत्ता, संपर्क माध्यमे, बँक तपशील आणि ओळख पूरक माहिती.</p>
            </div>
            <div className={styles.metaCard}>
              <span>Applicant</span>
              <strong>{[formData.firstName, formData.surname].filter(Boolean).join(' ') || 'नोंद नाही'}</strong>
              <small>Mobile {renderValue(formData.mobileNumber)}</small>
            </div>
          </header>

          <div className={styles.pageBody}>
            <div className={styles.sectionGrid}>
              <DetailField label="पूर्ण पत्ता" value={formData.fullAddress} wide />
              <DetailField label="महानगरपालिका क्षेत्रात राहतो/राहते का" value={formData.livesInCorporationArea} wide />
              <DetailField label="वार्ड क्रमांक" value={formData.wardNumber} />
              <DetailField label="प्रभाग समिती" value={formData.prabhagSamiti} />
              <DetailField label="UPHC" value={formData.uphc} />
              <DetailField label="पिनकोड" value={formData.pincode} />
              <DetailField label="मतदारसंघ" value={formData.constituency} wide />
              <DetailField label="मोबाईल क्रमांक" value={formData.mobileNumber} />
              <DetailField label="पर्यायी क्रमांक" value={formData.alternatePhone} />
              <DetailField label="बँकेचे नाव" value={formData.bankName} />
              <DetailField label="शाखा" value={formData.branchName} />
              <DetailField label="खाते क्रमांक" value={formData.accountNumber} />
              <DetailField label="IFSC" value={formData.ifscCode} />
              <DetailField label="BPL क्रमांक" value={formData.bplNumber} />
              <DetailField label="BPL वर्ष" value={formData.bplYear} />
            </div>
          </div>

          <div className={styles.pageFooter}>Page 2 of 4</div>
        </section>

        <section className={styles.page}>
          <header className={styles.pageHeader}>
            <div>
              <span className={styles.pageEyebrow}>Step 03</span>
              <h2>दिव्यांगत्व माहिती</h2>
              <p>दिव्यांगत्व प्रवर्ग, प्रमाणपत्र, पास, UDID आणि रोजगाराशी संबंधित तपशील.</p>
            </div>
            <div className={styles.metaCard}>
              <span>Selected disabilities</span>
              <strong>{formData.disabilityTypes.length}</strong>
              <small>{formData.disabilityTypes.length > 0 ? 'Categories selected' : 'निवड नाही'}</small>
            </div>
          </header>

          <div className={styles.pageBody}>
            <div className={styles.listCard}>
              <span className={styles.fieldLabel}>दिव्यांगत्व प्रकार</span>
              <div className={styles.list}>
                {formData.disabilityTypes.length > 0 ? (
                  formData.disabilityTypes.map((item) => (
                    <span className={styles.chip} key={item}>{item}</span>
                  ))
                ) : (
                  <div className={styles.fieldValue}>नोंद केलेले नाही</div>
                )}
              </div>
            </div>

            <div className={styles.sectionGrid}>
              <DetailField label="प्रमाणपत्र आहे का" value={formData.hasCertificate} />
              <DetailField label="प्रमाणपत्र क्रमांक" value={formData.certificateNumber} />
              <DetailField label="प्रमाणपत्र दिनांक" value={formatDate(formData.certificateDate)} />
              <DetailField label="प्रमाणपत्र प्रकार" value={formData.certificateType} />
              <DetailField label="दिव्यांगत्व टक्केवारी" value={formData.disabilityPercentage} />
              <DetailField label="UDID आहे का" value={formData.hasUDID} />
              <DetailField label="UDID क्रमांक" value={formData.udidNumber} />
              <DetailField label="ST पास आहे का" value={formData.hasSTPass} />
              <DetailField label="ST पास क्रमांक" value={formData.stPassNumber} />
              <DetailField label="रेल्वे पास आहे का" value={formData.hasRailwayPass} />
              <DetailField label="रेल्वे पास क्रमांक" value={formData.railwayPassNumber} />
              <DetailField label="MSRTC पास आहे का" value={formData.hasMSRTCPass} />
              <DetailField label="MSRTC पास क्रमांक" value={formData.msrtcPassNumber} />
              <DetailField label="रोजगार आहे का" value={formData.isEmployed} />
              <DetailField label="रोजगार प्रकार" value={formData.employmentType} />
              <DetailField label="व्यवसाय" value={formData.occupation} wide />
            </div>
          </div>

          <div className={styles.pageFooter}>Page 3 of 4</div>
        </section>

        <section className={styles.page}>
          <header className={styles.pageHeader}>
            <div>
              <span className={styles.pageEyebrow}>Step 04</span>
              <h2>लाभ, कागदपत्रे व अंतिम पडताळणी</h2>
              <p>शासकीय/मनपा लाभ, पालकत्व, सहाय्यक साहित्य, कागदपत्रे आणि सही तपशील.</p>
            </div>
            <div className={styles.metaCard}>
              <span>Status</span>
              <strong>{formData.termsAccepted ? 'Ready to print' : 'Review required'}</strong>
              <small>Declaration accepted: {renderValue(formData.termsAccepted)}</small>
            </div>
          </header>

          <div className={styles.pageBody}>
            <div className={styles.sectionGrid}>
              <DetailField label="शासकीय लाभ घेतला आहे का" value={formData.hasGovtBenefit} />
              <DetailField label="महानगरपालिका लाभ घेतला आहे का" value={formData.hasMCBenefit} />
              <DetailField label="शासकीय योजनेचे तपशील" value={formData.govtBenefitScheme} wide />
              <DetailField label="मनपा लाभ तपशील" value={formData.mcBenefitDetails} wide />
              <DetailField label="संजय गांधी पेन्शन" value={formData.hasSGNPension} />
              <DetailField label="स्वतःचे घर" value={formData.hasOwnHouse} />
              <DetailField label="घरकुल लाभ हवा आहे का" value={formData.wantsHousingBenefit} />
              <DetailField label="स्वतःची जागा" value={formData.hasOwnLand} />
              <DetailField label="पालकत्व प्रमाणपत्र" value={formData.hasGuardianship} />
              <DetailField label="पालकाचे नाव" value={formData.guardianName} />
              <DetailField label="पालकाचा पत्ता" value={formData.guardianAddress} wide />
              <DetailField label="पालकाचा संपर्क क्रमांक" value={formData.guardianPhone} />
              <DetailField label="साहित्याची गरज" value={formData.needsAssistiveDevice} />
              <DetailField label="कागदपत्रे सादर" value={formData.documentsSubmitted} />
              <DetailField label="अर्जदार सही दिनांक" value={formatDate(formData.applicantSignDate)} />
              <DetailField label="सर्वेक्षक नाव" value={formData.surveyorName} />
              <DetailField label="सर्वेक्षक हुद्दा" value={formData.surveyorDesignation} />
              <DetailField label="सर्वेक्षक मोबाईल" value={formData.surveyorMobile} />
            </div>

            <div className={styles.listCard}>
              <span className={styles.fieldLabel}>सहाय्यक साहित्य निवड</span>
              <div className={styles.list}>
                {formData.assistiveDevices.length > 0 ? (
                  formData.assistiveDevices.map((item) => (
                    <span className={styles.chip} key={item}>{item}</span>
                  ))
                ) : (
                  <div className={styles.fieldValue}>नोंद केलेले नाही</div>
                )}
              </div>
            </div>

            <div className={styles.documentCard}>
              <span className={styles.fieldLabel}>जोडलेली कागदपत्रे</span>
              {formData.documents.length > 0 ? (
                <div className={styles.documentList}>
                  {formData.documents.map((document) => (
                    <div className={styles.documentRow} key={document.field}>
                      <span className={styles.fieldValue}>{document.label}</span>
                      <span className={styles.fieldValue}>{document.fileName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.fieldValue}>प्रिंट snapshot मध्ये कोणतीही कागदपत्र फाइल नोंदलेली नाही.</div>
              )}
            </div>

            <div className={styles.signatureGrid}>
              <div className={styles.signatureCard}>
                <span className={styles.fieldLabel}>अर्जदार सही</span>
                <div className={styles.signatureFrame}>
                  {formData.applicantSignaturePreview ? (
                    <img src={formData.applicantSignaturePreview} alt="Applicant signature" />
                  ) : (
                    <div className={styles.placeholder}>सही उपलब्ध नाही</div>
                  )}
                </div>
                <div className={styles.fieldValue}>{formatDate(formData.applicantSignDate)}</div>
              </div>
              <div className={styles.signatureCard}>
                <span className={styles.fieldLabel}>सर्वेक्षक सही</span>
                <div className={styles.signatureFrame}>
                  {formData.surveyorSignaturePreview ? (
                    <img src={formData.surveyorSignaturePreview} alt="Surveyor signature" />
                  ) : (
                    <div className={styles.placeholder}>सही उपलब्ध नाही</div>
                  )}
                </div>
                <div className={styles.fieldValue}>{renderValue(formData.surveyorName)}</div>
              </div>
            </div>
          </div>

          <div className={styles.pageFooter}>Page 4 of 4</div>
        </section>
      </div>
    </div>
  )
}