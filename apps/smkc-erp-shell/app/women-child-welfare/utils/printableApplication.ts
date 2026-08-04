import type { FormData } from '../types/formTypes'

const STORAGE_PREFIX = 'wcwc-printable-application:'

const documentLabels: Record<string, string> = {
  udidDoc: 'UDID दस्तऐवज',
  aadhaarDoc: 'आधार कार्ड प्रत',
  rationCardDoc: 'रेशन कार्ड प्रत',
  bankDoc: 'बँक पासबुक / खाते तपशील',
  incomeCertificateDoc: 'उत्पन्न दाखला',
  photoDoc: 'फोटो प्रत',
  applicantSignature: 'अर्जदार सही',
  surveyorSignature: 'सर्वेक्षक सही',
}

export interface PrintableDocumentRecord {
  field: string
  label: string
  fileName: string
}

export interface PrintableApplicationSnapshot {
  registrationNumber: string
  submittedAt: string
  formData: PrintableFormSnapshot
}

export interface PrintableFormSnapshot {
  photoPreview: string
  surname: string
  firstName: string
  fatherName: string
  motherName: string
  education: string
  aadhaarNumber: string
  rationCardNumber: string
  rationCardColor: string
  dob: string
  maritalStatus: string
  religion: string
  caste: string
  familyRelation: string
  fullAddress: string
  livesInCorporationArea: string
  wardNumber: string
  prabhagSamiti: string
  uphc: string
  pincode: string
  constituency: string
  mobileNumber: string
  alternatePhone: string
  bankName: string
  branchName: string
  accountNumber: string
  ifscCode: string
  bplNumber: string
  bplYear: string
  disabilityTypes: string[]
  hasCertificate: string
  certificateNumber: string
  certificateDate: string
  certificateType: string
  disabilityPercentage: string
  hasUDID: string
  udidNumber: string
  hasSTPass: string
  stPassNumber: string
  hasRailwayPass: string
  railwayPassNumber: string
  hasMSRTCPass: string
  msrtcPassNumber: string
  isEmployed: string
  employmentType: string
  occupation: string
  hasGovtBenefit: string
  govtBenefitScheme: string
  hasMCBenefit: string
  mcBenefitDetails: string
  hasSGNPension: string
  hasOwnHouse: string
  wantsHousingBenefit: string
  hasOwnLand: string
  hasGuardianship: string
  guardianName: string
  guardianAddress: string
  guardianPhone: string
  needsAssistiveDevice: string
  assistiveDevices: string[]
  documentsSubmitted: string
  applicantSignaturePreview: string
  applicantSignDate: string
  surveyorName: string
  surveyorDesignation: string
  surveyorMobile: string
  surveyorSignaturePreview: string
  termsAccepted: boolean
  documents: PrintableDocumentRecord[]
}

function getStorageKey(registrationNumber: string) {
  return `${STORAGE_PREFIX}${registrationNumber}`
}

function buildDocumentList(formData: FormData): PrintableDocumentRecord[] {
  return Object.entries(documentLabels)
    .map(([field, label]) => {
      const file = formData[field as keyof FormData]
      return file instanceof File ? { field, label, fileName: file.name } : null
    })
    .filter((item): item is PrintableDocumentRecord => item !== null)
}

export function buildPrintableApplicationSnapshot(
  formData: FormData,
  registrationNumber: string,
  submittedAt = new Date().toISOString()
): PrintableApplicationSnapshot {
  return {
    registrationNumber,
    submittedAt,
    formData: {
      photoPreview: formData.photoPreview,
      surname: formData.surname,
      firstName: formData.firstName,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      education: formData.education,
      aadhaarNumber: formData.aadhaarNumber,
      rationCardNumber: formData.rationCardNumber,
      rationCardColor: formData.rationCardColor,
      dob: formData.dob,
      maritalStatus: formData.maritalStatus,
      religion: formData.religion,
      caste: formData.caste,
      familyRelation: formData.familyRelation,
      fullAddress: formData.fullAddress,
      livesInCorporationArea: formData.livesInCorporationArea,
      wardNumber: formData.wardNumber,
      prabhagSamiti: formData.prabhagSamiti,
      uphc: formData.uphc,
      pincode: formData.pincode,
      constituency: formData.constituency,
      mobileNumber: formData.mobileNumber,
      alternatePhone: formData.alternatePhone,
      bankName: formData.bankName,
      branchName: formData.branchName,
      accountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      bplNumber: formData.bplNumber,
      bplYear: formData.bplYear,
      disabilityTypes: [...formData.disabilityTypes],
      hasCertificate: formData.hasCertificate,
      certificateNumber: formData.certificateNumber,
      certificateDate: formData.certificateDate,
      certificateType: formData.certificateType,
      disabilityPercentage: formData.disabilityPercentage,
      hasUDID: formData.hasUDID,
      udidNumber: formData.udidNumber,
      hasSTPass: formData.hasSTPass,
      stPassNumber: formData.stPassNumber,
      hasRailwayPass: formData.hasRailwayPass,
      railwayPassNumber: formData.railwayPassNumber,
      hasMSRTCPass: formData.hasMSRTCPass,
      msrtcPassNumber: formData.msrtcPassNumber,
      isEmployed: formData.isEmployed,
      employmentType: formData.employmentType,
      occupation: formData.occupation,
      hasGovtBenefit: formData.hasGovtBenefit,
      govtBenefitScheme: formData.govtBenefitScheme,
      hasMCBenefit: formData.hasMCBenefit,
      mcBenefitDetails: formData.mcBenefitDetails,
      hasSGNPension: formData.hasSGNPension,
      hasOwnHouse: formData.hasOwnHouse,
      wantsHousingBenefit: formData.wantsHousingBenefit,
      hasOwnLand: formData.hasOwnLand,
      hasGuardianship: formData.hasGuardianship,
      guardianName: formData.guardianName,
      guardianAddress: formData.guardianAddress,
      guardianPhone: formData.guardianPhone,
      needsAssistiveDevice: formData.needsAssistiveDevice,
      assistiveDevices: [...formData.assistiveDevices],
      documentsSubmitted: formData.documentsSubmitted,
      applicantSignaturePreview: formData.applicantSignaturePreview,
      applicantSignDate: formData.applicantSignDate,
      surveyorName: formData.surveyorName,
      surveyorDesignation: formData.surveyorDesignation,
      surveyorMobile: formData.surveyorMobile,
      surveyorSignaturePreview: formData.surveyorSignaturePreview,
      termsAccepted: formData.termsAccepted,
      documents: buildDocumentList(formData),
    },
  }
}

export function savePrintableApplicationSnapshot(formData: FormData, registrationNumber: string) {
  if (typeof window === 'undefined' || !registrationNumber) {
    return
  }

  const snapshot = buildPrintableApplicationSnapshot(formData, registrationNumber)
  window.localStorage.setItem(getStorageKey(registrationNumber), JSON.stringify(snapshot))
}

export function getPrintableApplicationSnapshot(registrationNumber: string): PrintableApplicationSnapshot | null {
  if (typeof window === 'undefined' || !registrationNumber) {
    return null
  }

  const raw = window.localStorage.getItem(getStorageKey(registrationNumber))
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as PrintableApplicationSnapshot
  } catch {
    window.localStorage.removeItem(getStorageKey(registrationNumber))
    return null
  }
}

export function getPrintableApplicationUrl(registrationNumber: string, mode: 'print' | 'download' = 'print') {
  const params = mode === 'download' ? '?download=1' : '?autoprint=1'
  return `/women-child-welfare/disability-registration/print/${encodeURIComponent(registrationNumber)}${params}`
}