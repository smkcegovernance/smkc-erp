'use client'

import { useState } from 'react'
import Header from '../../women-child-welfare/components/Header'
import ProgressIndicator from '../../women-child-welfare/components/ProgressIndicator'
import PersonalInfoSection from '../../women-child-welfare/components/sections/PersonalInfoSection'
import AddressContactSection from '../../women-child-welfare/components/sections/AddressContactSection'
import DisabilityInfoSection from '../../women-child-welfare/components/sections/DisabilityInfoSection'
import DocumentsBenefitsSection from '../../women-child-welfare/components/sections/DocumentsBenefitsSection'
import ErpPopup from '../../components/ErpPopup'
import Footer from '../../women-child-welfare/components/Footer'
import { FormData, initialFormData } from '../../women-child-welfare/types/formTypes'
import { registerDisabledPerson } from './services/api'
import { getPrintableApplicationUrl, savePrintableApplicationSnapshot } from './utils/printableApplication'

type SectionId = 1 | 2 | 3 | 4

const sectionMeta: Array<{
  id: SectionId
  kicker: string
  title: string
  description: string
}> = [
  {
    id: 1,
    kicker: 'Step 01',
    title: 'वैयक्तिक माहिती',
    description: 'नाव, फोटो, आधार आणि मूलभूत वैयक्तिक तपशील भरा.',
  },
  {
    id: 2,
    kicker: 'Step 02',
    title: 'पत्ता व संपर्क',
    description: 'संपर्क साधण्यासाठी आवश्यक पत्ता, मोबाईल आणि बँक तपशील द्या.',
  },
  {
    id: 3,
    kicker: 'Step 03',
    title: 'दिव्यांगत्व माहिती',
    description: 'प्रमाणपत्र, UDID, सवलत पास आणि रोजगार स्थिती नोंदवा.',
  },
  {
    id: 4,
    kicker: 'Step 04',
    title: 'लाभ, कागदपत्रे व अंतिम पडताळणी',
    description: 'योजना लाभ, सहाय्यक साहित्य, कागदपत्रे आणि घोषणा पूर्ण करा.',
  },
]

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

function isBlank(value: string) {
  return value.trim().length === 0
}

type PopupTone = 'success' | 'error' | 'info' | 'warning' | 'confirm'

interface PopupState {
  open: boolean
  tone: PopupTone
  title: string
  description: string
}

export default function PublicDisabilityRegistrationPage() {
  const [currentSection, setCurrentSection] = useState<SectionId>(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [popup, setPopup] = useState<PopupState>({ open: false, tone: 'info', title: '', description: '' })
  const [mobileVerified, setMobileVerified] = useState(false)

  const openPrintableApplication = (applicationNumber: string, autoPrint = false) => {
    if (!applicationNumber) return
    window.open(getPrintableApplicationUrl(applicationNumber, autoPrint), '_blank', 'noopener,noreferrer')
  }

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const next: FormData = { ...prev, [field]: value }

      if (field === 'hasCertificate' && value !== 'आहे') {
        next.certificateNumber = ''
        next.certificateDate = ''
        next.certificateType = ''
        next.disabilityPercentage = ''
      }
      if (field === 'hasUDID' && value !== 'आहे') next.udidNumber = ''
      if (field === 'hasSTPass' && value !== 'आहे') next.stPassNumber = ''
      if (field === 'hasRailwayPass' && value !== 'आहे') next.railwayPassNumber = ''
      if (field === 'hasMSRTCPass' && value !== 'आहे') next.msrtcPassNumber = ''
      if (field === 'isEmployed' && value !== 'आहे') next.employmentType = ''
      if (field === 'hasGovtBenefit' && value !== 'होय') next.govtBenefitScheme = ''
      if (field === 'hasMCBenefit' && value !== 'होय') next.mcBenefitDetails = ''
      if (field === 'hasGuardianship' && value !== 'होय') {
        next.guardianName = ''
        next.guardianAddress = ''
        next.guardianPhone = ''
      }
      if (field === 'needsAssistiveDevice' && value !== 'होय') next.assistiveDevices = []

      return next
    })

    setErrors((prev) => {
      if (!prev[field as string]) return prev
      const newErrors = { ...prev }
      delete newErrors[field as string]
      return newErrors
    })
  }

  const updateFormDataField = (field: string, value: unknown) => {
    updateFormData(field as keyof FormData, value as FormData[keyof FormData])
  }

  const setFieldError = (field: keyof FormData | string, message?: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      if (message) {
        next[field] = message
      } else {
        delete next[field]
      }
      return next
    })
  }

  const validateSection = (section: SectionId): boolean => {
    const newErrors: Record<string, string> = {}

    if (section === 1) {
      if (!formData.photo && isBlank(formData.photoPreview)) newErrors.photo = 'कृपया अर्जदाराचा फोटो अपलोड करा'
      if (isBlank(formData.surname)) newErrors.surname = 'कृपया आडनाव प्रविष्ट करा'
      if (isBlank(formData.firstName)) newErrors.firstName = 'कृपया नाव प्रविष्ट करा'
      if (isBlank(formData.fatherName)) newErrors.fatherName = 'कृपया वडिलांचे नाव प्रविष्ट करा'
      if (isBlank(formData.education)) newErrors.education = 'कृपया शिक्षण निवडा'
      if (isBlank(formData.aadhaarNumber)) {
        newErrors.aadhaarNumber = 'कृपया आधार क्रमांक प्रविष्ट करा'
      } else if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
        newErrors.aadhaarNumber = 'कृपया वैध 12 अंकी आधार क्रमांक प्रविष्ट करा'
      }
      if (!formData.dob) newErrors.dob = 'कृपया जन्मतारीख निवडा'
      if (formData.dob && new Date(formData.dob) > new Date()) newErrors.dob = 'जन्मतारीख आजच्या तारखेपेक्षा पुढील असू शकत नाही'
      if (isBlank(formData.maritalStatus)) newErrors.maritalStatus = 'कृपया वैवाहिक स्थिती निवडा'
      if (isBlank(formData.religion)) newErrors.religion = 'कृपया धर्म निवडा'
      if (isBlank(formData.caste)) newErrors.caste = 'कृपया जात निवडा'
      if (isBlank(formData.familyRelation)) newErrors.familyRelation = 'कृपया कुटुंब प्रमुखाशी नाते निवडा'
      if (errors.photo && !newErrors.photo) newErrors.photo = errors.photo
    }

    if (section === 2) {
      if (isBlank(formData.fullAddress)) newErrors.fullAddress = 'कृपया पत्ता प्रविष्ट करा'
      if (isBlank(formData.mobileNumber)) {
        newErrors.mobileNumber = 'कृपया मोबाईल क्रमांक प्रविष्ट करा'
      } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
        newErrors.mobileNumber = 'कृपया वैध 10 अंकी मोबाईल क्रमांक प्रविष्ट करा'
      }
      if (!isBlank(formData.alternatePhone) && !/^\d{10}$/.test(formData.alternatePhone)) {
        newErrors.alternatePhone = 'कृपया वैध 10 अंकी पर्यायी क्रमांक प्रविष्ट करा'
      }
      if (isBlank(formData.pincode)) {
        newErrors.pincode = 'कृपया पिनकोड प्रविष्ट करा'
      } else if (!/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'कृपया वैध 6 अंकी पिनकोड प्रविष्ट करा'
      }
      if (isBlank(formData.bankName)) newErrors.bankName = 'कृपया बँकेचे नाव प्रविष्ट करा'
      if (isBlank(formData.branchName)) newErrors.branchName = 'कृपया शाखेचे नाव प्रविष्ट करा'
      if (isBlank(formData.accountNumber)) {
        newErrors.accountNumber = 'कृपया खाते क्रमांक प्रविष्ट करा'
      } else if (!/^\d{9,18}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'खाते क्रमांक 9 ते 18 अंकांचा असावा'
      }
      if (isBlank(formData.ifscCode)) {
        newErrors.ifscCode = 'कृपया IFSC क्रमांक प्रविष्ट करा'
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
        newErrors.ifscCode = 'कृपया वैध IFSC क्रमांक प्रविष्ट करा'
      }
      if (!isBlank(formData.bplYear) && !/^\d{4}$/.test(formData.bplYear)) {
        newErrors.bplYear = 'वर्ष 4 अंकी स्वरूपात प्रविष्ट करा'
      }
      if (!mobileVerified) {
        newErrors.mobileVerified = 'कृपया मोबाईल क्रमांक OTP द्वारे पडताळा'
      }
    }

    if (section === 3) {
      if (!formData.disabilityTypes || formData.disabilityTypes.length === 0) {
        newErrors.disabilityTypes = 'कृपया किमान एक दिव्यांगत्वाचा प्रकार निवडा'
      }
      if (isBlank(formData.hasCertificate)) newErrors.hasCertificate = 'कृपया प्रमाणपत्र आहे का ते निवडा'
      if (formData.hasCertificate === 'आहे') {
        if (isBlank(formData.certificateNumber)) newErrors.certificateNumber = 'दाखला क्रमांक आवश्यक आहे'
        if (!formData.certificateDate) newErrors.certificateDate = 'दाखल्याचा दिनांक निवडा'
        if (isBlank(formData.certificateType)) newErrors.certificateType = 'दाखल्याचा प्रकार निवडा'
        if (isBlank(formData.disabilityPercentage)) {
          newErrors.disabilityPercentage = 'दिव्यांगत्वाची टक्केवारी आवश्यक आहे'
        } else {
          const pct = Number(formData.disabilityPercentage)
          if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
            newErrors.disabilityPercentage = 'टक्केवारी 1 ते 100 दरम्यान असावी'
          }
        }
      }
      if (isBlank(formData.hasUDID)) newErrors.hasUDID = 'कृपया UDID आहे का ते निवडा'
      if (formData.hasUDID === 'आहे' && isBlank(formData.udidNumber)) newErrors.udidNumber = 'UDID क्रमांक आवश्यक आहे'
      if (isBlank(formData.hasSTPass)) newErrors.hasSTPass = 'कृपया ST पास आहे का ते निवडा'
      if (formData.hasSTPass === 'आहे' && isBlank(formData.stPassNumber)) newErrors.stPassNumber = 'ST पास क्रमांक आवश्यक आहे'
      if (isBlank(formData.hasRailwayPass)) newErrors.hasRailwayPass = 'कृपया रेल्वे पास आहे का ते निवडा'
      if (formData.hasRailwayPass === 'आहे' && isBlank(formData.railwayPassNumber)) newErrors.railwayPassNumber = 'रेल्वे पास क्रमांक आवश्यक आहे'
      if (isBlank(formData.hasMSRTCPass)) newErrors.hasMSRTCPass = 'कृपया MSRTC पास आहे का ते निवडा'
      if (formData.hasMSRTCPass === 'आहे' && isBlank(formData.msrtcPassNumber)) newErrors.msrtcPassNumber = 'MSRTC पास क्रमांक आवश्यक आहे'
      if (isBlank(formData.isEmployed)) newErrors.isEmployed = 'कृपया नोकरीत आहे का ते निवडा'
      if (formData.isEmployed === 'आहे') {
        if (isBlank(formData.employmentType)) newErrors.employmentType = 'रोजगार प्रकार निवडा'
        if (isBlank(formData.occupation)) newErrors.occupation = 'व्यवसाय प्रविष्ट करा'
      }
    }

    if (section === 4) {
      if (isBlank(formData.hasGovtBenefit)) newErrors.hasGovtBenefit = 'कृपया शासकीय लाभ घेतला आहे का ते निवडा'
      if (formData.hasGovtBenefit === 'होय' && isBlank(formData.govtBenefitScheme)) newErrors.govtBenefitScheme = 'योजनेचे तपशील आवश्यक आहेत'
      if (isBlank(formData.hasMCBenefit)) newErrors.hasMCBenefit = 'कृपया मनपा लाभ घेतला आहे का ते निवडा'
      if (formData.hasMCBenefit === 'होय' && isBlank(formData.mcBenefitDetails)) newErrors.mcBenefitDetails = 'महानगरपालिका लाभाचा तपशील आवश्यक आहे'
      if (isBlank(formData.hasSGNPension)) newErrors.hasSGNPension = 'कृपया संजय गांधी पेन्शन सुरू आहे का ते निवडा'
      if (isBlank(formData.hasOwnHouse)) newErrors.hasOwnHouse = 'कृपया स्वतःचे घर आहे का ते निवडा'
      if (isBlank(formData.wantsHousingBenefit)) newErrors.wantsHousingBenefit = 'कृपया घरकुल लाभ हवा आहे का ते निवडा'
      if (isBlank(formData.hasOwnLand)) newErrors.hasOwnLand = 'कृपया स्वतःच्या नावावर जागा आहे का ते निवडा'
      if (isBlank(formData.hasGuardianship)) newErrors.hasGuardianship = 'कृपया पालकत्व प्रमाणपत्र आहे का ते निवडा'
      if (formData.hasGuardianship === 'होय') {
        if (isBlank(formData.guardianName)) newErrors.guardianName = 'पालकाचे नाव आवश्यक आहे'
        if (isBlank(formData.guardianAddress)) newErrors.guardianAddress = 'पालकाचा पत्ता आवश्यक आहे'
        if (isBlank(formData.guardianPhone)) {
          newErrors.guardianPhone = 'पालकाचा मोबाईल क्रमांक आवश्यक आहे'
        } else if (!/^\d{10}$/.test(formData.guardianPhone)) {
          newErrors.guardianPhone = 'कृपया वैध 10 अंकी मोबाईल क्रमांक प्रविष्ट करा'
        }
      }
      if (isBlank(formData.needsAssistiveDevice)) newErrors.needsAssistiveDevice = 'कृपया साहित्याची गरज आहे का ते निवडा'
      if (formData.needsAssistiveDevice === 'होय' && formData.assistiveDevices.length === 0) newErrors.assistiveDevices = 'किमान एक साहित्य निवडा'
      if (isBlank(formData.documentsSubmitted)) newErrors.documentsSubmitted = 'कागदपत्रे सादर केली आहेत का ते निवडा'
      if (!formData.udidDoc) newErrors.udidDoc = 'कृपया UDID / दिव्यांग प्रमाणपत्र अपलोड करा'
      if (!formData.aadhaarDoc) newErrors.aadhaarDoc = 'कृपया आधारकार्ड / रेशनकार्ड अपलोड करा'
      if (!formData.bankDoc) newErrors.bankDoc = 'कृपया बँक खाते झेरॉक्स अपलोड करा'
      if (!formData.photoDoc) newErrors.photoDoc = 'कृपया फोटो अपलोड करा'
      if (!formData.applicantSignature && isBlank(formData.applicantSignaturePreview)) {
        newErrors.applicantSignature = 'कृपया अर्जदाराची सही अपलोड करा'
      }
      if (!formData.applicantSignDate) newErrors.applicantSignDate = 'अर्जदाराची सही दिनांक आवश्यक आहे'
      if (!formData.termsAccepted) newErrors.termsAccepted = 'कृपया अटी व शर्ती मान्य करा'
      ;['udidDoc', 'aadhaarDoc', 'bankDoc', 'photoDoc', 'applicantSignature'].forEach((field) => {
        if (errors[field]) newErrors[field] = errors[field]
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection((prev) => Math.min(prev + 1, 4) as SectionId)
      scrollToTop()
    }
  }

  const handlePrev = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 1) as SectionId)
    scrollToTop()
  }

  const handleSubmit = async () => {
    let isValid = true
    for (const section of sectionMeta) {
      if (!validateSection(section.id)) {
        isValid = false
        setCurrentSection(section.id)
        scrollToTop()
        break
      }
    }
    if (!isValid) return

    setIsSubmitting(true)
    try {
      const response = await registerDisabledPerson(formData)
      if (response.success) {
        const nextRegistrationNumber = response.registrationNumber || ''
        setRegistrationNumber(nextRegistrationNumber)
        savePrintableApplicationSnapshot(formData, nextRegistrationNumber)
        setPopup({
          open: true,
          tone: 'success',
          title: 'अर्ज यशस्वीरित्या सबमिट झाला आहे',
          description: 'हा अर्ज क्रमांक पुढील ट्रॅकिंगसाठी जतन करून ठेवा. Print / Save PDF वापरून A4 soft copy देखील जतन करता येईल.',
        })
      } else {
        setPopup({
          open: true,
          tone: 'error',
          title: 'अर्ज सबमिट करता आला नाही',
          description: response.message || 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setPopup({
        open: true,
        tone: 'error',
        title: 'अर्ज सबमिट करता आला नाही',
        description: error instanceof Error ? error.message : 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewRegistration = () => {
    setFormData(initialFormData)
    setCurrentSection(1)
    setRegistrationNumber('')
    setErrors({})
    setMobileVerified(false)
    setPopup({ open: false, tone: 'info', title: '', description: '' })
  }

  const handlePopupClose = () => {
    setPopup((prev) => ({ ...prev, open: false }))
  }

  const activeSection = sectionMeta.find((s) => s.id === currentSection) ?? sectionMeta[0]
  const completionCount = [
    !isBlank(formData.surname) && !isBlank(formData.firstName),
    !isBlank(formData.fullAddress) && !isBlank(formData.mobileNumber),
    formData.disabilityTypes.length > 0,
    formData.termsAccepted,
  ].filter(Boolean).length
  const selectedDisabilitySummary = formData.disabilityTypes.slice(0, 2).join(', ')
  const visibleErrors = Object.values(errors)

  return (
    <>
      <Header />
      <ProgressIndicator
        currentStep={currentSection}
        onStepClick={(step) => {
          if (step < currentSection) setCurrentSection(step as SectionId)
        }}
      />

      <main className="main-content">
        <div className="container">
          <div className="form-shell">
            <section className="form-hero-panel">
              <div>
                <span className="hero-kicker">सार्वजनिक नोंदणी | Public Registration</span>
                <h1 className="hero-title">दिव्यांग नोंदणी प्रक्रिया</h1>
                <p className="hero-copy">
                  फॉर्म आता चार स्पष्ट टप्प्यांत विभागलेला आहे. आवश्यक तपशील, पडताळणी आणि अंतिम घोषणेपर्यंत प्रत्येक भागात मार्गदर्शक सूचना दिसतील.
                </p>
              </div>
              <div className="hero-metrics" aria-label="Registration progress overview">
                <div className="hero-metric-card accent-blue">
                  <span className="metric-label">पूर्णता</span>
                  <strong>{completionCount}/4</strong>
                  <span className="metric-subtext">मुख्य टप्पे पूर्ण</span>
                </div>
                <div className="hero-metric-card accent-emerald">
                  <span className="metric-label">सक्रिय टप्पा</span>
                  <strong>{activeSection.kicker}</strong>
                  <span className="metric-subtext">{activeSection.title}</span>
                </div>

              </div>
            </section>

            <div className="form-layout-grid">
              <div className="form-main-column">
                <div className="section-context-panel">
                  <div>
                    <span className="context-kicker">{activeSection.kicker}</span>
                    <h2>{activeSection.title}</h2>
                    <p>{activeSection.description}</p>
                  </div>
                  <div className="context-chip">
                    <i className="bi bi-shield-check"></i>
                    <span>Inline validation enabled</span>
                  </div>
                </div>

                {visibleErrors.length > 0 && (
                  <div className="validation-banner" role="alert">
                    <div className="validation-banner-icon">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div>
                      <strong>काही माहिती तपासणे आवश्यक आहे.</strong>
                      <p>खालील फील्डमध्ये दिसणाऱ्या सूचना दुरुस्त करून पुढे जा.</p>
                    </div>
                  </div>
                )}

                <form className="registration-form" onSubmit={(e) => e.preventDefault()}>
                  {currentSection === 1 && (
                    <PersonalInfoSection
                      formData={formData}
                      updateFormData={updateFormDataField}
                      setFieldError={setFieldError}
                      errors={errors}
                      onNext={handleNext}
                    />
                  )}
                  {currentSection === 2 && (
                    <AddressContactSection
                      formData={formData}
                      updateFormData={updateFormDataField}
                      errors={errors}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      mobileVerified={mobileVerified}
                      onMobileVerified={setMobileVerified}
                    />
                  )}
                  {currentSection === 3 && (
                    <DisabilityInfoSection
                      formData={formData}
                      updateFormData={updateFormDataField}
                      errors={errors}
                      onNext={handleNext}
                      onPrev={handlePrev}
                    />
                  )}
                  {currentSection === 4 && (
                    <DocumentsBenefitsSection
                      formData={formData}
                      updateFormData={updateFormDataField}
                      setFieldError={setFieldError}
                      errors={errors}
                      onPrev={handlePrev}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </form>
              </div>

              <aside className="form-side-column">
                <div className="insight-card muted-card">
                  <div className="insight-card-header">
                    <span>Submission checklist</span>
                    <i className="bi bi-list-check"></i>
                  </div>
                  <ul className="checklist-list">
                    <li className={!isBlank(formData.aadhaarNumber) ? 'done' : ''}>आधार आणि जन्मतारीख पडताळा</li>
                    <li className={!isBlank(formData.mobileNumber) && !isBlank(formData.fullAddress) ? 'done' : ''}>संपर्क तपशील पूर्ण करा</li>
                    <li className={formData.disabilityTypes.length > 0 ? 'done' : ''}>दिव्यांगत्व प्रवर्ग निवडा</li>
                    <li className={formData.termsAccepted ? 'done' : ''}>अंतिम घोषणा स्वीकृत करा</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <ErpPopup
        open={popup.open}
        tone={popup.tone}
        title={popup.title}
        description={popup.description}
        onClose={handlePopupClose}
        actions={
          popup.tone === 'success'
            ? [
                { label: 'Print / Save PDF', onClick: () => openPrintableApplication(registrationNumber, true), variant: 'primary' },
                { label: 'Open Preview', onClick: () => openPrintableApplication(registrationNumber), variant: 'secondary' },
                { label: 'Close', onClick: handlePopupClose, variant: 'secondary' },
                { label: 'New Application', onClick: handleNewRegistration, variant: 'secondary' },
              ]
            : [{ label: 'OK', onClick: handlePopupClose, variant: 'primary' }]
        }
      >
        {popup.tone === 'success' && registrationNumber ? (
          <div className="tracking-number-card">
            <span className="tracking-number-label">Application Number</span>
            <strong className="tracking-number-value">{registrationNumber}</strong>
            <p className="tracking-number-note">Use this application number for future tracking, status checks, and A4 print copy access.</p>
          </div>
        ) : null}
      </ErpPopup>

      <Footer />
    </>
  )
}
