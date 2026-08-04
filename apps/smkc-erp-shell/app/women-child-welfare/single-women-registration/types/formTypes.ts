export interface SWRFormData {
  // Personal
  fullName: string
  dob: string
  mobileNumber: string
  aadhaarNumber: string

  // Location
  district: string
  village: string
  ward: string

  // Category
  womenCategory: string   // RURAL | URBAN | DOMESTIC | ADDITIONAL
  ageGroup: string        // 18-29 | 30-44 | 45-54 | 55-64+

  // Livelihood
  occupation: string
  annualIncome: string

  // Children
  childrenBelow6: string
  children6To14: string
  otherInfo: string

  // Schemes (Y/N per scheme)
  E_SHRAM: 'Y' | 'N'
  LIC_TERM: 'Y' | 'N'
  KVIC: 'Y' | 'N'
  MAVIM: 'Y' | 'N'
  MSBLM: 'Y' | 'N'
  SKILL_PROG: 'Y' | 'N'
  PMMVY: 'Y' | 'N'
  STREE: 'Y' | 'N'
  LOAN_SCHEME: 'Y' | 'N'
  MH_GRA_VIKAS: 'Y' | 'N'
  ATMABHAR: 'Y' | 'N'
  MGNREGA: 'Y' | 'N'
  FOOD_GRAIN: 'Y' | 'N'
  NPS: 'Y' | 'N'
  BAL_KALYAN: 'Y' | 'N'
  PMAY: 'Y' | 'N'
  TANTAMUKTA: 'Y' | 'N'
  GRAMODHYOG: 'Y' | 'N'
  ARTH_MAHA: 'Y' | 'N'
  BACHAT_GAT: 'Y' | 'N'
  ASHA: 'Y' | 'N'
  SHIMPIKAM: 'Y' | 'N'
  LADAKI_BAHIN: 'Y' | 'N'
  GRAMVIKAS: 'Y' | 'N'
  DARIDRA: 'Y' | 'N'
  SMKC_SCHEME: 'Y' | 'N'
  WCWC_SCHEME: 'Y' | 'N'
  FOOD_SEC: 'Y' | 'N'

  // Terms
  termsAccepted: boolean
}

export interface ApiResponse {
  success: boolean
  message: string
  registrationNumber?: string
  data?: unknown
  errorCode?: string
}

export const OCCUPATION_OPTIONS = [
  'शेती / शेतमजुरी',
  'घरगुती व्यवसाय',
  'हातमाग उद्योग',
  'दुकान / व्यापार',
  'सरकारी / निमशासकीय नोकरी',
  'खाजगी नोकरी',
  'बांधकाम मजुरी',
  'घरकामगार',
  'आशा / अंगनवाडी सेविका',
  'इतर',
]

export const SCHEMES_CONFIG = [
  [
    "E_SHRAM",
    "E-Shram Card Yojana"
  ],
  [
    "LIC_TERM",
    "LIC टर्म एश्युरन्स पूर्ण आयुष्य योजना"
  ],
  [
    "KVIC",
    "Maharashtra State Khadi and Village Industries Board"
  ],
  [
    "MAVIM",
    "Mobile Ambika Vikas Mahamandal (MAViM)"
  ],
  [
    "MSBLM",
    "Mahila Bachat Gat (MSBLM)"
  ],
  [
    "SKILL_PROG",
    "महिलांसाठी विशेष उपजीविका प्रशिक्षण कार्यक्रम"
  ],
  [
    "PMMVY",
    "Pradhan Mantri Matru Yojana (PMMVY)"
  ],
  [
    "STREE",
    "Stree 1-5 India Yojana"
  ],
  [
    "LOAN_SCHEME",
    "कर्ज योजना"
  ],
  [
    "MH_GRA_VIKAS",
    "महाराष्ट्र राज्य ग्रामविकास"
  ],
  [
    "ATMABHAR",
    "आत्मभरण"
  ],
  [
    "MGNREGA",
    "MGNREGA महात्मा गांधी"
  ],
  [
    "FOOD_GRAIN",
    "अन्न / धान्य योजना"
  ],
  [
    "NPS",
    "राष्ट्रीय पेन्शन"
  ],
  [
    "BAL_KALYAN",
    "बाल कल्याण"
  ],
  [
    "PMAY",
    "Pradhan Mantri Awas Yojana (PMAY)"
  ],
  [
    "TANTAMUKTA",
    "महात्मा गांधी तंटमुक्त"
  ],
  [
    "GRAMODHYOG",
    "ग्रामोद्योग बोर्ड"
  ],
  [
    "ARTH_MAHA",
    "आर्थिक विकास महामंडळ"
  ],
  [
    "BACHAT_GAT",
    "महिला बचत गट योजना"
  ],
  [
    "ASHA",
    "आशा कार्यक्रम"
  ],
  [
    "SHIMPIKAM",
    "शिंपीकाम"
  ],
  [
    "LADAKI_BAHIN",
    "मुख्यमंत्री लाडकी बहिण योजना"
  ],
  [
    "GRAMVIKAS",
    "राज्य ग्रामविकास"
  ],
  [
    "DARIDRA",
    "दारिद्र्य निर्मूलन"
  ],
  [
    "SMKC_SCHEME",
    "सांगली मिरज कुपवाड महानगरपालिका योजना"
  ],
  [
    "WCWC_SCHEME",
    "बालविकास महिला व बालकल्याण विभाग"
  ],
  [
    "FOOD_SEC",
    "अन्न सुरक्षा योजना"
  ]
]

export const initialFormData: SWRFormData = {
  fullName: '',
  dob: '',
  mobileNumber: '',
  aadhaarNumber: '',
  district: 'Sangli',
  village: '',
  ward: '',
  womenCategory: '',
  ageGroup: '',
  occupation: '',
  annualIncome: '',
  childrenBelow6: '0',
  children6To14: '0',
  otherInfo: '',
  E_SHRAM: 'N',
  LIC_TERM: 'N',
  KVIC: 'N',
  MAVIM: 'N',
  MSBLM: 'N',
  SKILL_PROG: 'N',
  PMMVY: 'N',
  STREE: 'N',
  LOAN_SCHEME: 'N',
  MH_GRA_VIKAS: 'N',
  ATMABHAR: 'N',
  MGNREGA: 'N',
  FOOD_GRAIN: 'N',
  NPS: 'N',
  BAL_KALYAN: 'N',
  PMAY: 'N',
  TANTAMUKTA: 'N',
  GRAMODHYOG: 'N',
  ARTH_MAHA: 'N',
  BACHAT_GAT: 'N',
  ASHA: 'N',
  SHIMPIKAM: 'N',
  LADAKI_BAHIN: 'N',
  GRAMVIKAS: 'N',
  DARIDRA: 'N',
  SMKC_SCHEME: 'N',
  WCWC_SCHEME: 'N',
  FOOD_SEC: 'N',
  termsAccepted: false,
}
