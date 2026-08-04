'use client'

import { useState } from 'react'
import SWRHeader from './components/Header'
import BasicInfoSection from './components/sections/BasicInfoSection'
import CategoryLivelihoodSection from './components/sections/CategoryLivelihoodSection'
import SchemesSection from './components/sections/SchemesSection'
import { SWRFormData, initialFormData } from './types/formTypes'
import { submitSWRRegistration } from './services/api'
import ErpPopup from '@/app/components/ErpPopup'

type SectionId = 1 | 2 | 3

type PopupTone = 'success' | 'error' | 'info' | 'warning' | 'confirm'
interface PopupState { open: boolean; tone: PopupTone; title: string; description: string }

const SECTION_IDS: SectionId[] = [1, 2, 3]

function isBlank(value: string | undefined | null) {
  return !value || value.trim().length === 0
}

export default function SingleWomenRegistrationPage() {
  const [currentSection, setCurrentSection] = useState<SectionId>(1)
  const [formData, setFormData] = useState<SWRFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [popup, setPopup] = useState<PopupState>({ open: false, tone: 'info', title: '', description: '' })

  const resetForm = () => {
    setFormData(initialFormData)
    setErrors({})
    setCurrentSection(1)
  }

  const closePopup = () => {
    const wasSuccess = popup.tone === 'success'
    setPopup(prev => ({ ...prev, open: false }))
    if (wasSuccess) {
      resetForm()
    }
  }

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value } as SWRFormData))
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const setFieldError = (field: string, msg?: string) => {
    if (msg) setErrors(prev => ({ ...prev, [field]: msg }))
    else setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const validateSection = (section: SectionId, data: SWRFormData = formData): Record<string, string> => {
    const nextErrors: Record<string, string> = {}

    if (section === 1) {
      if (isBlank(data.fullName)) nextErrors.fullName = 'पूर्ण नाव भरणे आवश्यक आहे.'
      if (isBlank(data.dob)) nextErrors.dob = 'जन्मतारीख भरणे आवश्यक आहे.'
      if (!/^\d{10}$/.test(data.mobileNumber)) nextErrors.mobileNumber = 'वैध 10 अंकी मोबाईल नंबर आवश्यक आहे.'
      if (!/^\d{12}$/.test(data.aadhaarNumber)) nextErrors.aadhaarNumber = 'वैध 12 अंकी आधार क्रमांक आवश्यक आहे.'
      if (isBlank(data.district)) nextErrors.district = 'जिल्हा भरणे आवश्यक आहे.'
      if (isBlank(data.village)) nextErrors.village = 'गाव / शहर निवडणे आवश्यक आहे.'
      if (isBlank(data.ward)) nextErrors.ward = 'वॉर्ड निवडणे आवश्यक आहे.'
    }

    if (section === 2) {
      if (isBlank(data.womenCategory)) nextErrors.womenCategory = 'महिला वर्ग निवडा.'
      if (isBlank(data.ageGroup)) nextErrors.ageGroup = 'वयोगट निवडा.'
      if (isBlank(data.occupation)) nextErrors.occupation = 'व्यवसाय निवडा.'
      if (isBlank(data.annualIncome)) nextErrors.annualIncome = 'वार्षिक उत्पन्न भरणे आवश्यक आहे.'
      if (isBlank(data.childrenBelow6)) nextErrors.childrenBelow6 = '6 वर्षाखालील मुलांची संख्या भरणे आवश्यक आहे.'
      if (isBlank(data.children6To14)) nextErrors.children6To14 = '6 ते 14 वर्षे मुलांची संख्या भरणे आवश्यक आहे.'
      if (isBlank(data.otherInfo)) nextErrors.otherInfo = 'इतर माहिती भरणे आवश्यक आहे.'
    }

    if (section === 3) {
      if (!data.termsAccepted) nextErrors.termsAccepted = 'अटी व शर्तींना संमती द्या.'
    }

    return nextErrors
  }

  const firstInvalidSection = (data: SWRFormData = formData): SectionId | null => {
    for (const sectionId of SECTION_IDS) {
      if (Object.keys(validateSection(sectionId, data)).length > 0) {
        return sectionId
      }
    }
    return null
  }

  const canAccessSection = (targetSection: SectionId): boolean => {
    if (targetSection <= currentSection) return true

    for (const sectionId of SECTION_IDS) {
      if (sectionId >= targetSection) break
      if (Object.keys(validateSection(sectionId)).length > 0) return false
    }

    return true
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const goNext = () => {
    const sectionErrors = validateSection(currentSection)
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...sectionErrors }))
      setPopup({
        open: true,
        tone: 'warning',
        title: 'माहिती अपूर्ण आहे',
        description: 'पुढे जाण्यापूर्वी या टप्प्यातील सर्व आवश्यक माहिती भरा.',
      })
      return
    }

    setCurrentSection(prev => (prev < 3 ? (prev + 1) as SectionId : prev))
    scrollToTop()
  }

  const goPrev = () => {
    setCurrentSection(prev => (prev > 1 ? (prev - 1) as SectionId : prev))
    scrollToTop()
  }

  const jumpToSection = (targetSection: SectionId) => {
    if (!canAccessSection(targetSection)) {
      const target = firstInvalidSection() ?? 1
      const targetErrors = validateSection(target)
      setErrors(prev => ({ ...prev, ...targetErrors }))
      setCurrentSection(target)
      setPopup({
        open: true,
        tone: 'info',
        title: 'क्रमाने माहिती भरा',
        description: 'आधीचे टप्पे पूर्ण केल्यावरच पुढील टप्प्यावर जाऊ शकता.',
      })
      scrollToTop()
      return
    }

    setCurrentSection(targetSection)
    scrollToTop()
  }

  const handleSubmit = async () => {
    const combinedErrors: Record<string, string> = {}
    for (const sectionId of SECTION_IDS) {
      Object.assign(combinedErrors, validateSection(sectionId))
    }

    if (Object.keys(combinedErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...combinedErrors }))
      const invalidSection = firstInvalidSection() ?? 1
      setCurrentSection(invalidSection)
      setPopup({
        open: true,
        tone: 'warning',
        title: 'अपूर्ण माहिती',
        description: `कृपया ${Object.keys(combinedErrors).length} आवश्यक फील्ड भरून पुन्हा सबमिट करा.`,
      })
      scrollToTop()
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitSWRRegistration(formData)
      if (result.success) {
        const regNum = result.registrationNumber || ''
        setPopup({
          open: true, tone: 'success',
          title: 'नोंदणी यशस्वी!',
          description: `तुमची नोंदणी यशस्वीरित्या केली गेली. नोंदणी क्रमांक: ${regNum}`
        })
      } else {
        setPopup({
          open: true, tone: 'error',
          title: 'नोंदणी अयशस्वी',
          description: result.message || 'नोंदणी करताना त्रुटी आली. पुन्हा प्रयत्न करा.'
        })
      }
    } catch {
      setPopup({ open: true, tone: 'error', title: 'त्रुटी', description: 'अपेक्षित त्रुटी आली. पुन्हा प्रयत्न करा.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // suppress unused warning
  void setFieldError

  const stageValidity = {
    1: Object.keys(validateSection(1)).length === 0,
    2: Object.keys(validateSection(2)).length === 0,
    3: Object.keys(validateSection(3)).length === 0,
  }
  const completedCount = (stageValidity[1] ? 1 : 0) + (stageValidity[2] ? 1 : 0) + (stageValidity[3] ? 1 : 0)
  const progressPercent = Math.round((completedCount / 3) * 100)
  const progressHint = completedCount === 3
    ? 'सर्व टप्पे पूर्ण झाले आहेत. अंतिम सबमिट करा.'
    : `${completedCount + 1} क्रमांकाचा टप्पा पूर्ण करा.`

  const STEPS = [
    { id: 1, label: 'मूलभूत माहिती' },
    { id: 2, label: 'वर्ग व उपजीविका' },
    { id: 3, label: 'शासकीय योजना' },
  ]

  return (
    <div className="wcwc-registration-wrapper">
      <SWRHeader />

      {/* Progress */}
      <div className="container py-3">
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold text-secondary">फॉर्म प्रगती</span>
            <span className="fw-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="progress" style={{ height: 12, borderRadius: 999, backgroundColor: '#e9ecef' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${progressPercent}%`, borderRadius: 999, background: 'linear-gradient(90deg, #0ea5a4 0%, #2563eb 100%)' }}
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="small text-muted mt-2">{progressHint}</div>
        </div>
        <div className="d-flex justify-content-center gap-2 gap-md-4 mb-4 flex-wrap">
          {STEPS.map(step => (
            <button
              type="button"
              key={step.id}
              onClick={() => jumpToSection(step.id as SectionId)}
              disabled={!canAccessSection(step.id as SectionId)}
              className={`text-center flex-fill step-indicator ${currentSection === step.id ? 'active' : currentSection > step.id ? 'completed' : ''}`}
              style={{
                minWidth: 140,
                border: '1px solid #dee2e6',
                borderRadius: 12,
                background: currentSection === step.id ? '#f0f9ff' : '#fff',
                padding: '10px 12px',
                cursor: canAccessSection(step.id as SectionId) ? 'pointer' : 'not-allowed',
                opacity: canAccessSection(step.id as SectionId) ? 1 : 0.55,
              }}
            >
              <div style={{ margin: '0 auto 8px', width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', background: stageValidity[step.id as 1 | 2 | 3] ? '#dcfce7' : currentSection === step.id ? '#dbeafe' : '#f3f4f6', color: stageValidity[step.id as 1 | 2 | 3] ? '#15803d' : currentSection === step.id ? '#1d4ed8' : '#6b7280' }}>
                <i className={`bi ${stageValidity[step.id as 1 | 2 | 3] ? 'bi-check-lg' : currentSection === step.id ? 'bi-pencil-square' : 'bi-lock'}`} />
              </div>
              <div className="step-label small">{step.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="container pb-5">
        {currentSection === 1 && (
          <BasicInfoSection formData={formData} updateFormData={updateFormData} errors={errors} onNext={goNext} />
        )}
        {currentSection === 2 && (
          <CategoryLivelihoodSection formData={formData} updateFormData={updateFormData} errors={errors} onNext={goNext} onPrev={goPrev} />
        )}
        {currentSection === 3 && (
          <SchemesSection formData={formData} updateFormData={updateFormData} errors={errors} onSubmit={handleSubmit} onPrev={goPrev} isSubmitting={isSubmitting} />
        )}
      </div>

      {popup.open && (
        <ErpPopup
          tone={popup.tone}
          title={popup.title}
          description={popup.description}
          onClose={closePopup}
          actions={popup.tone === 'success'
            ? [{ label: 'OK', onClick: closePopup, variant: 'primary' }]
            : undefined}
        />
      )}
    </div>
  )
}
