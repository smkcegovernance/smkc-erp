export interface FormData {
  // Personal Information
  photo: File | null
  photoPreview: string
  surname: string
  firstName: string
  fatherName: string
  motherName: string
  education: string
  aadhaarNumber: string
  dob: string
  maritalStatus: string
  religion: string
  caste: string
  familyRelation: string

  // Address & Contact
  fullAddress: string
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

  // Disability Information
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

  // Benefits & Documents
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

  // Document Uploads
  udidDoc: File | null
  aadhaarDoc: File | null
  bankDoc: File | null
  photoDoc: File | null
  applicantSignature: File | null
  applicantSignaturePreview: string
  applicantSignDate: string
  surveyorName: string
  surveyorDesignation: string
  surveyorMobile: string
  surveyorSignature: File | null
  surveyorSignaturePreview: string

  // Terms
  termsAccepted: boolean
}

export const initialFormData: FormData = {
  // Personal Information
  photo: null,
  photoPreview: '',
  surname: '',
  firstName: '',
  fatherName: '',
  motherName: '',
  education: '',
  aadhaarNumber: '',
  dob: '',
  maritalStatus: '',
  religion: '',
  caste: '',
  familyRelation: '',

  // Address & Contact
  fullAddress: '',
  wardNumber: '',
  prabhagSamiti: '',
  uphc: '',
  pincode: '',
  constituency: '',
  mobileNumber: '',
  alternatePhone: '',
  bankName: '',
  branchName: '',
  accountNumber: '',
  ifscCode: '',
  bplNumber: '',
  bplYear: '',

  // Disability Information
  disabilityTypes: [],
  hasCertificate: '',
  certificateNumber: '',
  certificateDate: '',
  certificateType: '',
  disabilityPercentage: '',
  hasUDID: '',
  udidNumber: '',
  hasSTPass: '',
  stPassNumber: '',
  hasRailwayPass: '',
  railwayPassNumber: '',
  hasMSRTCPass: '',
  msrtcPassNumber: '',
  isEmployed: '',
  employmentType: '',
  occupation: '',

  // Benefits & Documents
  hasGovtBenefit: '',
  govtBenefitScheme: '',
  hasMCBenefit: '',
  mcBenefitDetails: '',
  hasSGNPension: '',
  hasOwnHouse: '',
  wantsHousingBenefit: '',
  hasOwnLand: '',
  hasGuardianship: '',
  guardianName: '',
  guardianAddress: '',
  guardianPhone: '',
  needsAssistiveDevice: '',
  assistiveDevices: [],
  documentsSubmitted: '',

  // Document Uploads
  udidDoc: null,
  aadhaarDoc: null,
  bankDoc: null,
  photoDoc: null,
  applicantSignature: null,
  applicantSignaturePreview: '',
  applicantSignDate: '',
  surveyorName: '',
  surveyorDesignation: '',
  surveyorMobile: '',
  surveyorSignature: null,
  surveyorSignaturePreview: '',

  // Terms
  termsAccepted: false
}

export interface ApiResponse {
  success: boolean
  message?: string
  registrationNumber?: string
  data?: any
}

export const DISABILITY_TYPES = [
  { id: 1, value: '1. Blindness', label: '1. Blindness पूर्णतः अंध' },
  { id: 2, value: '2. Low Vision', label: '2. Low vision अंशतः अंध/दृष्टिदोष' },
  { id: 3, value: '3. Hearing Impairment', label: '3. Hearing Impairment कर्णबधिर' },
  { id: 4, value: '4. Speech and Language Disability', label: '4. Speech and Language disability वाचादोष' },
  { id: 5, value: '5. Locomotor Disability', label: '5. Locomotor Disability अस्थिव्यंग' },
  { id: 6, value: '6. Mental Illness', label: '6. Mental Illness मानसिक आजार' },
  { id: 7, value: '7. Specific Learning Disabilities', label: '7. Specific Learning Disabilities अध्ययन अक्षमता' },
  { id: 8, value: '8. Cerebral Palsy', label: '8. Cerebral Palsy सेरेब्रल पाल्सी (मेंदूचा पक्षाघात)' },
  { id: 9, value: '9. Autism Spectrum Disorder', label: '9. Autism Spectrum Disorder स्वमग्न' },
  { id: 10, value: '10. Multiple Disabilities', label: '10. Multiple Disabilities बहुविकलांग' },
  { id: 11, value: '11. Leprosy Cured Persons', label: '11. Leprosy Cured persons कुष्ठरोग' },
  { id: 12, value: '12. Dwarfism', label: '12. Dwarfism बुटकेपणा' },
  { id: 13, value: '13. Intellectual Disability', label: '13. Intellectual Disability मतिमंद' },
  { id: 14, value: '14. Muscular Dystrophy', label: '14. Muscular Dystrophy अविकसित मांसपेशी / स्नायूची विकृती' },
  { id: 15, value: '15. Chronic Neurological Conditions', label: '15. Chronic Neurological conditions मज्जासंस्थेचे तीव्र आजार' },
  { id: 16, value: '16. Multiple Sclerosis', label: '16. Multiple Sclerosis मज्जासंस्थेचे संबंधी आजार' },
  { id: 17, value: '17. Thalassemia', label: '17. Thalassemia रक्तविकार/कॅन्सर' },
  { id: 18, value: '18. Hemophilia', label: '18. Hemophilia रक्तवाहिन्या संबंधित आजार' },
  { id: 19, value: '19. Sickle Cell Disease', label: '19. Sickle Cell disease रक्ताचे प्रमाण कमी असणे' },
  { id: 20, value: '20. Acid Attack Victim', label: '20. Acid Attack victim ॲसिड हल्लाग्रस्त पीडित' },
  { id: 21, value: '21. Parkinson\'s Disease', label: '21. Parkinson\'s disease कंपावात रोग' },
]

export const ASSISTIVE_DEVICES = [
  { id: 'device1', value: 'तीनचाकी सायकल', label: 'तीनचाकी सायकल' },
  { id: 'device2', value: 'व्हील चेअर', label: 'व्हील चेअर' },
  { id: 'device3', value: 'कुबड्या', label: 'कुबड्या' },
  { id: 'device4', value: 'जयपूरफुट', label: 'जयपूरफुट' },
  { id: 'device5', value: 'श्रवणयंत्र', label: 'श्रवणयंत्र' },
  { id: 'device6', value: 'शस्त्रक्रिया', label: 'शस्त्रक्रिया' },
  { id: 'device7', value: 'उत्पादक वस्तू', label: 'उत्पादक वस्तू' },
  { id: 'device8', value: 'इतर', label: 'इतर' },
]

export const EDUCATION_OPTIONS = [
  { value: 'निरक्षर', label: 'निरक्षर' },
  { value: 'पायाभूत/पूर्व प्राथमिक', label: 'पायाभूत / पूर्व प्राथमिक (शिशु गट, छोटा गट, मोठा गट, 1 ली व 2री)' },
  { value: 'प्राथमिक/पूर्व माध्यमिक', label: 'प्राथमिक / पूर्व माध्यमिक (3 री ते 5 वी)' },
  { value: 'माध्यमिक', label: 'माध्यमिक (6वी ते 8वी)' },
  { value: 'उच्च माध्यमिक', label: 'उच्च माध्यमिक (9वी ते 12वी)' },
  { value: 'पदवीधर', label: 'पदवीधर' },
  { value: 'पदव्युत्तर पद', label: 'पदव्युत्तर पद' },
]

export const RELIGION_OPTIONS = [
  { value: 'हिंदू', label: 'हिंदू' },
  { value: 'बौद्ध', label: 'बौद्ध' },
  { value: 'मुस्लिम', label: 'मुस्लिम' },
  { value: 'शीख', label: 'शीख' },
  { value: 'ख्रिश्चन', label: 'ख्रिश्चन' },
  { value: 'जैन', label: 'जैन' },
  { value: 'इतर', label: 'इतर' },
]

export const CASTE_OPTIONS = [
  { value: 'अनुसूचित जाती', label: 'अनुसूचित जाती' },
  { value: 'अनुसूचित जमाती', label: 'अनुसूचित जमाती' },
  { value: 'इ.मा.व', label: 'इ.मा.व' },
  { value: 'वि.मा.प्र.', label: 'वि.मा.प्र.' },
  { value: 'वि.भा.भ.ज.', label: 'वि.भा.भ.ज.' },
  { value: 'इतर', label: 'इतर' },
]

export const FAMILY_RELATION_OPTIONS = [
  { value: 'स्वतः', label: 'स्वतः' },
  { value: 'पत्नी', label: 'पत्नी' },
  { value: 'मुलगा', label: 'मुलगा' },
  { value: 'मुलगी', label: 'मुलगी' },
  { value: 'सून', label: 'सून' },
  { value: 'नातू', label: 'नातू' },
  { value: 'जावई', label: 'जावई' },
  { value: 'नात', label: 'नात' },
  { value: 'इतर', label: 'इतर' },
]

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'शासकीय/निमशासकीय', label: 'शासकीय / निमशासकीय' },
  { value: 'खाजगी', label: 'खाजगी' },
  { value: 'जिल्हा परिषद', label: 'जिल्हा परिषद' },
  { value: 'मनपा', label: 'मनपा' },
  { value: 'नगरपरिषद', label: 'नगरपरिषद' },
  { value: 'महसूल', label: 'महसूल' },
  { value: 'इतर', label: 'इतर' },
]
