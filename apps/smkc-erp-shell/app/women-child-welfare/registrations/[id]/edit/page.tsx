'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEPARTMENTS } from '@smkc/types'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import PersonalInfoSection from '../../../components/sections/PersonalInfoSection'
import AddressContactSection from '../../../components/sections/AddressContactSection'
import DisabilityInfoSection from '../../../components/sections/DisabilityInfoSection'
import DocumentsBenefitsSection from '../../../components/sections/DocumentsBenefitsSection'
import { FormData, initialFormData, DISABILITY_TYPES } from '../../../types/formTypes'
import { getRegistration, updateRegistration } from '../../../services/api'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeKeys(obj: unknown): Record<string, unknown> {
  const r = obj as Record<string, unknown>
  const n: Record<string, unknown> = {}
  for (const k of Object.keys(r)) n[k.toUpperCase()] = r[k]
  return n
}

function isoToDate(v: unknown): string {
  if (!v) return ''
  return String(v).split('T')[0] ?? ''
}

/** DB stores Y/N after NormalizeFlag; convert back to the Marathi string the form expects */
function ynToMarathi(v: unknown, yesWord: 'आहे' | 'होय'): string {
  const s = String(v ?? '').trim().toUpperCase()
  if (s === 'Y') return yesWord
  if (s === 'N') return 'नाही'
  // If already a Marathi string (legacy or direct insert), pass through
  return String(v ?? '')
}

function docInlineUrl(registrationNo: string, docCode: string, fileName: string): string {
  return `/api/women-child-welfare/documents/download?registrationNumber=${encodeURIComponent(registrationNo)}&documentCode=${encodeURIComponent(docCode)}&fileName=${encodeURIComponent(fileName)}&inline=true`
}

function mapApiToForm(
  data: unknown,
  existingDocs: Record<string, unknown>[]
): FormData {
  const d = data as Record<string, unknown>

  // Normalize registration row
  const regRows = (d['registration'] ?? d['Registration'] ?? []) as Record<string, unknown>[]
  const reg = regRows[0] ? normalizeKeys(regRows[0]) : {}

  // Disability types → find DISABILITY_TYPES value by English name match
  const disabilityRows = (d['disabilities'] ?? d['Disabilities'] ?? []) as Record<string, unknown>[]
  const disabilityTypes = disabilityRows
    .map(r => normalizeKeys(r))
    .map(r => {
      const nameEn = String(r['DISABILITY_NAME_EN'] ?? '').trim().toLowerCase()
      const match = DISABILITY_TYPES.find(dt =>
        dt.value.toLowerCase().replace(/^\d+\.\s*/, '').includes(nameEn) ||
        nameEn.includes(dt.value.toLowerCase().replace(/^\d+\.\s*/, ''))
      )
      return match ? match.value : String(r['DISABILITY_NAME_EN'] ?? '')
    })
    .filter(Boolean)

  // Assistive devices → Marathi device name used directly as form value
  const deviceRows = (d['devices'] ?? d['Devices'] ?? []) as Record<string, unknown>[]
  const assistiveDevices = deviceRows
    .map(r => normalizeKeys(r))
    .map(r => String(r['DEVICE_NAME'] ?? ''))
    .filter(Boolean)

  // Existing document URLs for preview
  const regNo = String(reg['REGISTRATION_NO'] ?? '')
  const findDoc = (code: string) => existingDocs.find(d => d['DOCUMENT_CODE'] === code)

  const photoDocRow = findDoc('PHOTO_DOC')
  const appSigRow = findDoc('APPLICANT_SIGNATURE')
  const survSigRow = findDoc('SURVEYOR_SIGNATURE')

  const photoPreview = photoDocRow
    ? docInlineUrl(regNo, 'PHOTO_DOC', String(photoDocRow['FILE_NAME'] ?? ''))
    : ''
  const applicantSignaturePreview = appSigRow
    ? docInlineUrl(regNo, 'APPLICANT_SIGNATURE', String(appSigRow['FILE_NAME'] ?? ''))
    : ''
  const surveyorSignaturePreview = survSigRow
    ? docInlineUrl(regNo, 'SURVEYOR_SIGNATURE', String(survSigRow['FILE_NAME'] ?? ''))
    : ''

  return {
    // Personal
    photo: null,
    photoPreview,
    surname: String(reg['SURNAME'] ?? ''),
    firstName: String(reg['FIRST_NAME'] ?? ''),
    fatherName: String(reg['FATHER_NAME'] ?? ''),
    motherName: String(reg['MOTHER_NAME'] ?? ''),
    education: String(reg['EDUCATION'] ?? ''),
    aadhaarNumber: String(reg['AADHAAR_NUMBER'] ?? ''),
    rationCardNumber: String(reg['RATION_CARD_NUMBER'] ?? ''),
    rationCardColor: String(reg['RATION_CARD_COLOR'] ?? ''),
    dob: isoToDate(reg['DOB']),
    maritalStatus: String(reg['MARITAL_STATUS'] ?? ''),
    religion: String(reg['RELIGION'] ?? ''),
    caste: String(reg['CASTE_NAME'] ?? ''),
    familyRelation: String(reg['FAMILY_RELATION'] ?? ''),

    // Address & Contact
    fullAddress: String(reg['FULL_ADDRESS'] ?? ''),
    livesInCorporationArea: String(reg['LIVES_IN_CORPORATION_AREA'] ?? ''),
    wardNumber: String(reg['WARD_NUMBER'] ?? ''),
    prabhagSamiti: String(reg['PRABHAG_SAMITI'] ?? ''),
    uphc: String(reg['UPHC'] ?? ''),
    pincode: String(reg['PINCODE'] ?? ''),
    constituency: String(reg['CONSTITUENCY'] ?? ''),
    mobileNumber: String(reg['MOBILE_NUMBER'] ?? ''),
    alternatePhone: String(reg['ALTERNATE_PHONE'] ?? ''),
    bankName: String(reg['BANK_NAME'] ?? ''),
    branchName: String(reg['BRANCH_NAME'] ?? ''),
    accountNumber: String(reg['ACCOUNT_NUMBER'] ?? ''),
    ifscCode: String(reg['IFSC_CODE'] ?? ''),
    bplNumber: String(reg['BPL_NUMBER'] ?? ''),
    bplYear: String(reg['BPL_YEAR'] ?? ''),

    // Disability
    disabilityTypes,
    hasCertificate: ynToMarathi(reg['HAS_CERTIFICATE'], 'आहे'),
    certificateNumber: String(reg['CERTIFICATE_NUMBER'] ?? ''),
    certificateDate: isoToDate(reg['CERTIFICATE_DATE']),
    certificateType: String(reg['CERTIFICATE_TYPE'] ?? ''),
    disabilityPercentage: reg['DISABILITY_PERCENTAGE'] != null ? String(reg['DISABILITY_PERCENTAGE']) : '',
    hasUDID: ynToMarathi(reg['HAS_UDID'], 'आहे'),
    udidNumber: String(reg['UDID_NUMBER'] ?? ''),
    hasSTPass: ynToMarathi(reg['HAS_ST_PASS'], 'आहे'),
    stPassNumber: String(reg['ST_PASS_NUMBER'] ?? ''),
    hasRailwayPass: ynToMarathi(reg['HAS_RAILWAY_PASS'], 'आहे'),
    railwayPassNumber: String(reg['RAILWAY_PASS_NUMBER'] ?? ''),
    hasMSRTCPass: ynToMarathi(reg['HAS_MSRTC_PASS'], 'आहे'),
    msrtcPassNumber: String(reg['MSRTC_PASS_NUMBER'] ?? ''),
    isEmployed: ynToMarathi(reg['IS_EMPLOYED'], 'आहे'),
    employmentType: String(reg['EMPLOYMENT_TYPE'] ?? ''),
    occupation: String(reg['OCCUPATION'] ?? ''),

    // Benefits
    hasGovtBenefit: ynToMarathi(reg['HAS_GOVT_BENEFIT'], 'होय'),
    govtBenefitScheme: String(reg['GOVT_BENEFIT_SCHEME'] ?? ''),
    hasMCBenefit: ynToMarathi(reg['HAS_MC_BENEFIT'], 'होय'),
    mcBenefitDetails: String(reg['MC_BENEFIT_DETAILS'] ?? ''),
    hasSGNPension: ynToMarathi(reg['HAS_SGN_PENSION'], 'होय'),
    hasOwnHouse: ynToMarathi(reg['HAS_OWN_HOUSE'], 'होय'),
    wantsHousingBenefit: ynToMarathi(reg['WANTS_HOUSING_BENEFIT'], 'होय'),
    hasOwnLand: ynToMarathi(reg['HAS_OWN_LAND'], 'होय'),
    hasGuardianship: ynToMarathi(reg['HAS_GUARDIANSHIP'], 'होय'),
    guardianName: String(reg['GUARDIAN_NAME'] ?? ''),
    guardianAddress: String(reg['GUARDIAN_ADDRESS'] ?? ''),
    guardianPhone: String(reg['GUARDIAN_PHONE'] ?? ''),
    needsAssistiveDevice: ynToMarathi(reg['NEEDS_ASSISTIVE_DEVICE'], 'होय'),
    assistiveDevices,
    documentsSubmitted: ynToMarathi(reg['DOCUMENTS_SUBMITTED'], 'होय'),

    // Documents — null = not replaced (server keeps existing file)
    udidDoc: null,
    aadhaarDoc: null,
    rationCardDoc: null,
    bankDoc: null,
    incomeCertificateDoc: null,
    photoDoc: null,

    // Signatures
    applicantSignature: null,
    applicantSignaturePreview,
    applicantSignDate: isoToDate(reg['APPLICANT_SIGN_DATE']),
    surveyorName: String(reg['SURVEYOR_NAME'] ?? ''),
    surveyorDesignation: String(reg['SURVEYOR_DESIGNATION'] ?? ''),
    surveyorMobile: String(reg['SURVEYOR_MOBILE'] ?? ''),
    surveyorSignature: null,
    surveyorSignaturePreview,

    termsAccepted: false,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SectionId = 1 | 2 | 3 | 4
type PopupTone = 'success' | 'error' | 'info' | 'warning' | 'confirm'

function isBlank(v: string) { return !v || v.trim().length === 0 }

export default function EditRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const registrationId = params.id as string

  const dept = DEPARTMENTS.find(d => d.key === 'women-child-welfare')!
  const { T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Loading state
  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentSection, setCurrentSection] = useState<SectionId>(1)
  // Mobile is pre-verified for dept edit
  const [mobileVerified] = useState(true)
  // Track which doc codes already exist on the server
  const [existingDocCodes, setExistingDocCodes] = useState<Set<string>>(new Set())

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [popup, setPopup] = useState<{
    open: boolean; tone: PopupTone; title: string; description: string; onConfirm?: () => void
  }>({ open: false, tone: 'info', title: '', description: '' })

  // Load registration data
  const load = useCallback(async () => {
    setPageLoading(true)
    setLoadError('')
    const res = await getRegistration(registrationId)
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>
      const docRows = (d['documents'] ?? d['Documents'] ?? []) as Record<string, unknown>[]
      const normalizedDocs = docRows.map(r => {
        const n: Record<string, unknown> = {}
        for (const k of Object.keys(r)) n[k.toUpperCase()] = r[k]
        return n
      })
      setExistingDocCodes(new Set(normalizedDocs.map(r => String(r['DOCUMENT_CODE'] ?? ''))))
      setFormData(mapApiToForm(res.data, normalizedDocs))
    } else {
      setLoadError(res.message ?? 'नोंदणी आढळली नाही.')
    }
    setPageLoading(false)
  }, [registrationId])

  useEffect(() => { load() }, [load])

  // ── Form helpers (same side-effect logic as public form) ──────────────────

  const updateFormData = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => {
      const next: FormData = { ...prev, [field]: value }

      if (field === 'hasCertificate' && value !== 'आहे') {
        next.certificateNumber = ''; next.certificateDate = ''; next.certificateType = ''; next.disabilityPercentage = ''
      }
      if (field === 'hasUDID' && value !== 'आहे') next.udidNumber = ''
      if (field === 'hasSTPass' && value !== 'आहे') next.stPassNumber = ''
      if (field === 'hasRailwayPass' && value !== 'आहे') next.railwayPassNumber = ''
      if (field === 'hasMSRTCPass' && value !== 'आहे') next.msrtcPassNumber = ''
      if (field === 'isEmployed' && value !== 'आहे') { next.employmentType = ''; next.occupation = '' }
      if (field === 'hasGovtBenefit' && value !== 'होय') next.govtBenefitScheme = ''
      if (field === 'hasMCBenefit' && value !== 'होय') next.mcBenefitDetails = ''
      if (field === 'hasGuardianship' && value !== 'होय') { next.guardianName = ''; next.guardianAddress = ''; next.guardianPhone = '' }
      if (field === 'needsAssistiveDevice' && value !== 'होय') next.assistiveDevices = []

      return next
    })
    setErrors(prev => {
      if (!prev[field as string]) return prev
      const n = { ...prev }
      delete n[field as string]
      return n
    })
  }, [])

  const updateFormDataField = useCallback((field: string, value: unknown) => {
    updateFormData(field as keyof FormData, value as FormData[keyof FormData])
  }, [updateFormData])

  const setFieldError = useCallback((field: keyof FormData | string, message?: string) => {
    setErrors(prev => {
      const n = { ...prev }
      if (message) n[field] = message; else delete n[field]
      return n
    })
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────

  const validateSection = useCallback((section: SectionId): boolean => {
    const e: Record<string, string> = {}

    if (section === 1) {
      if (!formData.photo && isBlank(formData.photoPreview)) e.photo = 'कृपया अर्जदाराचा फोटो अपलोड करा'
      if (isBlank(formData.surname)) e.surname = 'कृपया आडनाव प्रविष्ट करा'
      if (isBlank(formData.firstName)) e.firstName = 'कृपया नाव प्रविष्ट करा'
      if (isBlank(formData.fatherName)) e.fatherName = 'कृपया वडिलांचे नाव प्रविष्ट करा'
      if (isBlank(formData.education)) e.education = 'कृपया शिक्षण निवडा'
      if (isBlank(formData.aadhaarNumber)) e.aadhaarNumber = 'कृपया आधार क्रमांक प्रविष्ट करा'
      else if (!/^\d{12}$/.test(formData.aadhaarNumber)) e.aadhaarNumber = 'कृपया वैध 12 अंकी आधार क्रमांक प्रविष्ट करा'
      if (isBlank(formData.rationCardNumber)) e.rationCardNumber = 'कृपया रेशन कार्ड क्रमांक प्रविष्ट करा'
      if (isBlank(formData.rationCardColor)) e.rationCardColor = 'कृपया रेशन कार्ड रंग निवडा'
      if (!formData.dob) e.dob = 'कृपया जन्मतारीख निवडा'
      if (isBlank(formData.maritalStatus)) e.maritalStatus = 'कृपया वैवाहिक स्थिती निवडा'
      if (isBlank(formData.religion)) e.religion = 'कृपया धर्म निवडा'
      if (isBlank(formData.caste)) e.caste = 'कृपया जात निवडा'
      if (isBlank(formData.familyRelation)) e.familyRelation = 'कृपया कुटुंब प्रमुखाशी नाते निवडा'
    }

    if (section === 2) {
      if (isBlank(formData.fullAddress)) e.fullAddress = 'कृपया पत्ता प्रविष्ट करा'
      if (isBlank(formData.mobileNumber)) e.mobileNumber = 'कृपया मोबाईल क्रमांक प्रविष्ट करा'
      else if (!/^\d{10}$/.test(formData.mobileNumber)) e.mobileNumber = 'कृपया वैध 10 अंकी मोबाईल क्रमांक प्रविष्ट करा'
      if (!isBlank(formData.alternatePhone) && !/^\d{10}$/.test(formData.alternatePhone)) e.alternatePhone = 'कृपया वैध 10 अंकी पर्यायी क्रमांक प्रविष्ट करा'
      if (isBlank(formData.pincode)) e.pincode = 'कृपया पिनकोड प्रविष्ट करा'
      else if (!/^\d{6}$/.test(formData.pincode)) e.pincode = 'कृपया वैध 6 अंकी पिनकोड प्रविष्ट करा'
      if (isBlank(formData.bankName)) e.bankName = 'कृपया बँकेचे नाव प्रविष्ट करा'
      if (isBlank(formData.branchName)) e.branchName = 'कृपया शाखेचे नाव प्रविष्ट करा'
      if (isBlank(formData.accountNumber)) e.accountNumber = 'कृपया खाते क्रमांक प्रविष्ट करा'
      else if (!/^\d{9,18}$/.test(formData.accountNumber)) e.accountNumber = 'खाते क्रमांक 9 ते 18 अंकांचा असावा'
      if (isBlank(formData.ifscCode)) e.ifscCode = 'कृपया IFSC क्रमांक प्रविष्ट करा'
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) e.ifscCode = 'कृपया वैध IFSC क्रमांक प्रविष्ट करा'
    }

    if (section === 3) {
      if (!formData.disabilityTypes || formData.disabilityTypes.length === 0) e.disabilityTypes = 'कृपया किमान एक दिव्यांगत्वाचा प्रकार निवडा'
      if (isBlank(formData.hasCertificate)) e.hasCertificate = 'कृपया प्रमाणपत्र आहे का ते निवडा'
      if (formData.hasCertificate === 'आहे') {
        if (isBlank(formData.certificateNumber)) e.certificateNumber = 'दाखला क्रमांक आवश्यक आहे'
        if (!formData.certificateDate) e.certificateDate = 'दाखल्याचा दिनांक निवडा'
        if (isBlank(formData.certificateType)) e.certificateType = 'दाखल्याचा प्रकार निवडा'
        if (isBlank(formData.disabilityPercentage)) e.disabilityPercentage = 'दिव्यांगत्वाची टक्केवारी आवश्यक आहे'
        else {
          const pct = Number(formData.disabilityPercentage)
          if (!Number.isFinite(pct) || pct < 1 || pct > 100) e.disabilityPercentage = 'टक्केवारी 1 ते 100 दरम्यान असावी'
        }
      }
      if (isBlank(formData.hasUDID)) e.hasUDID = 'कृपया UDID आहे का ते निवडा'
      if (formData.hasUDID === 'आहे' && isBlank(formData.udidNumber)) e.udidNumber = 'UDID क्रमांक आवश्यक आहे'
      if (isBlank(formData.hasSTPass)) e.hasSTPass = 'कृपया ST पास आहे का ते निवडा'
      if (isBlank(formData.hasRailwayPass)) e.hasRailwayPass = 'कृपया रेल्वे पास आहे का ते निवडा'
      if (isBlank(formData.hasMSRTCPass)) e.hasMSRTCPass = 'कृपया MSRTC पास आहे का ते निवडा'
      if (isBlank(formData.isEmployed)) e.isEmployed = 'कृपया नोकरीत आहे का ते निवडा'
      if (formData.isEmployed === 'आहे') {
        if (isBlank(formData.employmentType)) e.employmentType = 'रोजगार प्रकार निवडा'
        if (isBlank(formData.occupation)) e.occupation = 'व्यवसाय प्रविष्ट करा'
      }
    }

    if (section === 4) {
      if (isBlank(formData.hasGovtBenefit)) e.hasGovtBenefit = 'कृपया शासकीय लाभ घेतला आहे का ते निवडा'
      if (formData.hasGovtBenefit === 'होय' && isBlank(formData.govtBenefitScheme)) e.govtBenefitScheme = 'योजनेचे तपशील आवश्यक आहेत'
      if (isBlank(formData.hasMCBenefit)) e.hasMCBenefit = 'कृपया मनपा लाभ घेतला आहे का ते निवडा'
      if (isBlank(formData.hasSGNPension)) e.hasSGNPension = 'कृपया संजय गांधी पेन्शन सुरू आहे का ते निवडा'
      if (isBlank(formData.hasOwnHouse)) e.hasOwnHouse = 'कृपया स्वतःचे घर आहे का ते निवडा'
      if (isBlank(formData.wantsHousingBenefit)) e.wantsHousingBenefit = 'कृपया घरकुल लाभ हवा आहे का ते निवडा'
      if (isBlank(formData.hasOwnLand)) e.hasOwnLand = 'कृपया स्वतःच्या नावावर जागा आहे का ते निवडा'
      if (isBlank(formData.hasGuardianship)) e.hasGuardianship = 'कृपया पालकत्व प्रमाणपत्र आहे का ते निवडा'
      if (isBlank(formData.needsAssistiveDevice)) e.needsAssistiveDevice = 'कृपया साहाय्यक साधन हवे आहे का ते निवडा'
      if (formData.needsAssistiveDevice === 'होय' && formData.assistiveDevices.length === 0) e.assistiveDevices = 'किमान एक साहित्य निवडा'
      if (isBlank(formData.documentsSubmitted)) e.documentsSubmitted = 'कागदपत्रे सादर केली आहेत का ते निवडा'
      // Documents: required only if NOT already on server and no new file chosen
      if (!formData.udidDoc && !existingDocCodes.has('UDID_DOC')) e.udidDoc = 'कृपया UDID / दिव्यांग प्रमाणपत्र अपलोड करा'
      if (!formData.aadhaarDoc && !existingDocCodes.has('AADHAAR_DOC')) e.aadhaarDoc = 'कृपया आधारकार्ड अपलोड करा'
      if (!formData.rationCardDoc && !existingDocCodes.has('RATION_CARD_DOC')) e.rationCardDoc = 'कृपया रेशनकार्ड अपलोड करा'
      if (!formData.bankDoc && !existingDocCodes.has('BANK_DOC')) e.bankDoc = 'कृपया बँक खाते झेरॉक्स अपलोड करा'
      if (!formData.incomeCertificateDoc && !existingDocCodes.has('INCOME_CERTIFICATE_DOC')) e.incomeCertificateDoc = 'कृपया उत्पन्न दाखला / वार्षिक आय प्रमाणपत्र अपलोड करा'
      if (!formData.photoDoc && !existingDocCodes.has('PHOTO_DOC')) e.photoDoc = 'कृपया फोटो अपलोड करा'
      if (!formData.applicantSignature && isBlank(formData.applicantSignaturePreview)) e.applicantSignature = 'कृपया अर्जदाराची सही अपलोड करा'
      if (!formData.applicantSignDate) e.applicantSignDate = 'अर्जदाराची सही दिनांक आवश्यक आहे'
      if (!formData.termsAccepted) e.termsAccepted = 'कृपया अटी व शर्ती मान्य करा'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }, [formData, existingDocCodes, errors])

  const handleNext = useCallback(() => {
    if (validateSection(currentSection)) {
      setCurrentSection(prev => Math.min(prev + 1, 4) as SectionId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [validateSection, currentSection])

  const handlePrev = useCallback(() => {
    setCurrentSection(prev => Math.max(prev - 1, 1) as SectionId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    // Validate all sections
    let firstInvalid: SectionId | null = null
    for (const s of [1, 2, 3, 4] as SectionId[]) {
      if (!validateSection(s)) { firstInvalid = s; break }
    }
    if (firstInvalid !== null) {
      setCurrentSection(firstInvalid)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)
    const res = await updateRegistration(registrationId, formData)
    setIsSubmitting(false)

    if (res.success) {
      setPopup({
        open: true,
        tone: 'success',
        title: 'नोंदणी अद्यतनित झाली',
        description: `${registrationId} — माहिती यशस्वीपणे जतन झाली.`,
      })
    } else {
      const isNetwork = res.errorCode === 'SERVER_UNREACHABLE' || res.errorCode === 'GATEWAY_TIMEOUT'
      setPopup({
        open: true,
        tone: isNetwork ? 'warning' : 'error',
        title: isNetwork ? 'नेटवर्क समस्या' : 'अद्यतन करता आले नाही',
        description: res.message ?? 'माहिती जतन करताना त्रुटी आली.',
      })
    }
  }, [validateSection, registrationId, formData])

  // ── Render ────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="dept-layout">
        <DeptSidebar deptKey="women-child-welfare" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
        <main className="erp-main">
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
            <div className="spinner-border text-primary mb-3" role="status" />
            <p>नोंदणी लोड होत आहे...</p>
          </div>
        </main>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="dept-layout">
        <DeptSidebar deptKey="women-child-welfare" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
        <main className="erp-main">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="bi bi-exclamation-circle" style={{ fontSize: '2.5rem', color: '#c63b31', display: 'block', marginBottom: 12 }} />
            <p style={{ color: '#7a2020', fontWeight: 600 }}>{loadError}</p>
            <Link href="/women-child-welfare/registrations" className="btn btn-outline-primary btn-sm mt-2">
              ← नोंदणी यादीकडे परत जा
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const sections = ['वैयक्तिक माहिती', 'पत्ता व संपर्क', 'दिव्यांगत्व माहिती', 'लाभ, कागदपत्रे व पडताळणी']

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
          <Link href="/women-child-welfare/dashboard" className="dash-breadcrumb-home">{dept.label}</Link>
          <span className="dash-breadcrumb-sep">›</span>
          <Link href="/women-child-welfare/registrations" className="dash-breadcrumb-home">नोंदणी व्यवस्थापन</Link>
          <span className="dash-breadcrumb-sep">›</span>
          <span className="dash-breadcrumb-current">{registrationId} — संपादन</span>
        </nav>

        {/* Page header */}
        <div className="erp-page-header">
          <div className="erp-page-header-text">
            <div className="erp-page-kicker">Department Edit</div>
            <h1 className="erp-page-title">
              <button
                type="button"
                className="dept-sidebar-toggle-btn"
                style={{ marginRight: 12 }}
                onClick={() => setSidebarOpen(v => !v)}
              >
                <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} />
              </button>
              नोंदणी संपादन
              <span style={{ marginLeft: 12, fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                {registrationId}
              </span>
            </h1>
          </div>
          <Link
            href="/women-child-welfare/registrations"
            className="dash-view-tab"
            style={{ textDecoration: 'none', gap: 6 }}
          >
            <i className="bi bi-arrow-left" />
            यादीकडे परत जा
          </Link>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
          {sections.map((label, i) => {
            const s = (i + 1) as SectionId
            const active = currentSection === s
            const done = currentSection > s
            return (
              <button
                key={s}
                type="button"
                className={`dash-view-tab${active ? ' active' : ''}`}
                style={{ gap: 6, opacity: done ? 0.65 : 1 }}
                onClick={() => setCurrentSection(s)}
              >
                {done && <i className="bi bi-check-circle-fill" style={{ color: '#117a5d', fontSize: '0.8rem' }} />}
                <span style={{ fontSize: '0.78rem' }}>{s}.</span> {label}
              </button>
            )
          })}
        </div>

        {/* Info banner */}
        <div style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: '1.25rem',
          background: '#fff8e6', border: '1.5px solid #f5d591', color: '#92400e',
          fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="bi bi-pencil-square" />
          <span>विभागीय संपादन मोड — नवीन फाइल अपलोड केली तरच जुनी बदलली जाईल. अपूर्ण कागदपत्रे असल्यास खाली Step 4 मध्ये थेट री-अपलोड करू शकता.</span>
        </div>

        {/* Existing-document status pills */}
        {existingDocCodes.size > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
            {Array.from(existingDocCodes).map(code => (
              <span key={code} style={{
                padding: '2px 10px', borderRadius: 14, fontSize: '0.72rem', fontWeight: 600,
                background: '#d9f4ec', color: '#0a5240', border: '1px solid #86d9be',
              }}>
                <i className="bi bi-paperclip me-1" />
                {code.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Form sections */}
        <div className="erp-card" style={{ padding: 0, overflow: 'visible' }}>
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
              onMobileVerified={() => {/* already verified */}}
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
              existingDocCodes={existingDocCodes}
              onPrev={handlePrev}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>

      {/* Result popup */}
      <ErpPopup
        open={popup.open}
        tone={popup.tone}
        title={popup.title}
        description={popup.description}
        actions={popup.tone === 'success' ? [
          { label: 'यादीकडे परत जा', onClick: () => router.push('/women-child-welfare/registrations'), variant: 'primary' },
          { label: 'येथेच राहा', onClick: () => setPopup(p => ({ ...p, open: false })), variant: 'secondary' },
        ] : undefined}
        onClose={() => setPopup(p => ({ ...p, open: false }))}
      />
    </div>
  )
}
