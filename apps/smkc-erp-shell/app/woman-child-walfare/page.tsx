'use client'

import { useState } from 'react'
import Header from './components/Header'
import ProgressIndicator from './components/ProgressIndicator'
import PersonalInfoSection from './components/sections/PersonalInfoSection'
import AddressContactSection from './components/sections/AddressContactSection'
import DisabilityInfoSection from './components/sections/DisabilityInfoSection'
import DocumentsBenefitsSection from './components/sections/DocumentsBenefitsSection'
import SuccessModal from './components/SuccessModal'
import Footer from './components/Footer'
import { FormData, initialFormData } from './types/formTypes'
import { registerDisabledPerson } from './services/api'

export default function Home() {
  const [currentSection, setCurrentSection] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateSection = (section: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (section === 1) {
      if (!formData.surname?.trim()) newErrors.surname = 'कृपया आडनाव प्रविष्ट करा'
      if (!formData.firstName?.trim()) newErrors.firstName = 'कृपया नाव प्रविष्ट करा'
      if (!formData.fatherName?.trim()) newErrors.fatherName = 'कृपया वडिलांचे नाव प्रविष्ट करा'
      if (!formData.aadhaarNumber?.trim()) {
        newErrors.aadhaarNumber = 'कृपया आधार क्रमांक प्रविष्ट करा'
      } else if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
        newErrors.aadhaarNumber = 'कृपया वैध 12 अंकी आधार क्रमांक प्रविष्ट करा'
      }
      if (!formData.dob) newErrors.dob = 'कृपया जन्मतारीख निवडा'
    }

    if (section === 2) {
      if (!formData.fullAddress?.trim()) newErrors.fullAddress = 'कृपया पत्ता प्रविष्ट करा'
      if (!formData.mobileNumber?.trim()) {
        newErrors.mobileNumber = 'कृपया मोबाईल क्रमांक प्रविष्ट करा'
      } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
        newErrors.mobileNumber = 'कृपया वैध 10 अंकी मोबाईल क्रमांक प्रविष्ट करा'
      }
      if (!formData.pincode?.trim()) {
        newErrors.pincode = 'कृपया पिनकोड प्रविष्ट करा'
      } else if (!/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'कृपया वैध 6 अंकी पिनकोड प्रविष्ट करा'
      }
    }

    if (section === 3) {
      if (!formData.disabilityTypes || formData.disabilityTypes.length === 0) {
        newErrors.disabilityTypes = 'कृपया किमान एक दिव्यांगत्वाचा प्रकार निवडा'
      }
    }

    if (section === 4) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'कृपया अटी व शर्ती मान्य करा'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(prev => Math.min(prev + 1, 4))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    setCurrentSection(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    // Validate all sections
    let isValid = true
    for (let i = 1; i <= 4; i++) {
      if (!validateSection(i)) {
        isValid = false
        setCurrentSection(i)
        break
      }
    }

    if (!isValid) return

    setIsSubmitting(true)

    try {
      const response = await registerDisabledPerson(formData)
      
      if (response.success) {
        setRegistrationNumber(response.registrationNumber || '')
        setShowSuccessModal(true)
      } else {
        alert(response.message || 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewRegistration = () => {
    setFormData(initialFormData)
    setCurrentSection(1)
    setShowSuccessModal(false)
    setErrors({})
  }

  return (
    <>
      <Header />
      <ProgressIndicator 
        currentStep={currentSection} 
        onStepClick={(step) => {
          if (step < currentSection) {
            setCurrentSection(step)
          }
        }}
      />
      
      <main className="main-content">
        <div className="container">
          <form className="registration-form" onSubmit={(e) => e.preventDefault()}>
            {currentSection === 1 && (
              <PersonalInfoSection
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
                onNext={handleNext}
              />
            )}
            
            {currentSection === 2 && (
              <AddressContactSection
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            )}
            
            {currentSection === 3 && (
              <DisabilityInfoSection
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            )}
            
            {currentSection === 4 && (
              <DocumentsBenefitsSection
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
                onPrev={handlePrev}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </form>
        </div>
      </main>

      <SuccessModal
        show={showSuccessModal}
        registrationNumber={registrationNumber}
        onClose={handleNewRegistration}
      />

      <Footer />
    </>
  )
}

