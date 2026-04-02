'use client'

import { useRef, ChangeEvent } from 'react'
import { FormData, EDUCATION_OPTIONS, RELIGION_OPTIONS, CASTE_OPTIONS, FAMILY_RELATION_OPTIONS } from '../../types/formTypes'

interface PersonalInfoSectionProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
  onNext: () => void
}

export default function PersonalInfoSection({
  formData,
  updateFormData,
  errors,
  onNext,
}: PersonalInfoSectionProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('कृपया फक्त इमेज फाइल निवडा')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('फाइल साइज 5MB पेक्षा कमी असावी')
        return
      }
      updateFormData('photo', file)
      const reader = new FileReader()
      reader.onload = (e) => {
        updateFormData('photoPreview', e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value
    
    // Format specific fields
    if (field === 'aadhaarNumber') {
      value = value.replace(/\D/g, '').slice(0, 12)
    }
    
    updateFormData(field, value)
  }

  return (
    <section className="form-section active" id="section1">
      <div className="section-header">
        <h4><i className="bi bi-person-vcard"></i> वैयक्तिक माहिती</h4>
      </div>
      <div className="section-body">
        {/* Photo Upload */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="photo-upload-container">
              <div className="photo-preview" onClick={() => photoInputRef.current?.click()}>
                {formData.photoPreview ? (
                  <img src={formData.photoPreview} alt="Photo Preview" />
                ) : (
                  <>
                    <i className="bi bi-camera"></i>
                    <span>दिव्यांग व्यक्तीचा फोटो</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                className="d-none"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                className="btn btn-outline-primary btn-sm mt-2"
                onClick={() => photoInputRef.current?.click()}
              >
                <i className="bi bi-upload"></i> फोटो अपलोड करा
              </button>
            </div>
          </div>
        </div>

        {/* Name Details */}
        <div className="form-group-card">
          <div className="card-label">1. दिव्यांग व्यक्तीचे नाव</div>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">आडनाव <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.surname ? 'is-invalid' : ''}`}
                value={formData.surname}
                onChange={handleInputChange('surname')}
                placeholder="आडनाव"
              />
              {errors.surname && <div className="invalid-feedback">{errors.surname}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label">नाव <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                placeholder="नाव"
              />
              {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label">वडिलांचे नाव <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.fatherName ? 'is-invalid' : ''}`}
                value={formData.fatherName}
                onChange={handleInputChange('fatherName')}
                placeholder="वडिलांचे नाव"
              />
              {errors.fatherName && <div className="invalid-feedback">{errors.fatherName}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label">आईचे नाव</label>
              <input
                type="text"
                className="form-control"
                value={formData.motherName}
                onChange={handleInputChange('motherName')}
                placeholder="आईचे नाव"
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="form-group-card">
          <div className="card-label">3. शिक्षण</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="education-options">
                {EDUCATION_OPTIONS.map((option) => (
                  <div key={option.value} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="education"
                      id={`edu-${option.value}`}
                      value={option.value}
                      checked={formData.education === option.value}
                      onChange={handleInputChange('education')}
                    />
                    <label className="form-check-label" htmlFor={`edu-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aadhaar and DOB */}
        <div className="form-group-card">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">4. आधार कार्ड क्रमांक <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.aadhaarNumber ? 'is-invalid' : ''}`}
                value={formData.aadhaarNumber}
                onChange={handleInputChange('aadhaarNumber')}
                placeholder="12 अंकी आधार क्रमांक"
                maxLength={12}
              />
              {errors.aadhaarNumber && <div className="invalid-feedback">{errors.aadhaarNumber}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">5. जन्मतारीख <span className="required">*</span></label>
              <input
                type="date"
                className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
                value={formData.dob}
                onChange={handleInputChange('dob')}
              />
              {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
            </div>
          </div>
        </div>

        {/* Marital Status */}
        <div className="form-group-card">
          <div className="card-label">9. वैवाहिक स्थिती</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle">
                {['विवाहित', 'अविवाहित'].map((status) => (
                  <div key={status} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="maritalStatus"
                      id={`marital-${status}`}
                      value={status}
                      checked={formData.maritalStatus === status}
                      onChange={handleInputChange('maritalStatus')}
                    />
                    <label className="form-check-label" htmlFor={`marital-${status}`}>
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Religion */}
        <div className="form-group-card">
          <div className="card-label">10. धर्म</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle">
                {RELIGION_OPTIONS.map((option) => (
                  <div key={option.value} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="religion"
                      id={`religion-${option.value}`}
                      value={option.value}
                      checked={formData.religion === option.value}
                      onChange={handleInputChange('religion')}
                    />
                    <label className="form-check-label" htmlFor={`religion-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Caste */}
        <div className="form-group-card">
          <div className="card-label">11. जात</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle">
                {CASTE_OPTIONS.map((option) => (
                  <div key={option.value} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="caste"
                      id={`caste-${option.value}`}
                      value={option.value}
                      checked={formData.caste === option.value}
                      onChange={handleInputChange('caste')}
                    />
                    <label className="form-check-label" htmlFor={`caste-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Family Relation */}
        <div className="form-group-card">
          <div className="card-label">12. कुटुंब प्रमुखाशी नाते</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle">
                {FAMILY_RELATION_OPTIONS.map((option) => (
                  <div key={option.value} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="familyRelation"
                      id={`relation-${option.value}`}
                      value={option.value}
                      checked={formData.familyRelation === option.value}
                      onChange={handleInputChange('familyRelation')}
                    />
                    <label className="form-check-label" htmlFor={`relation-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="form-navigation">
          <button type="button" className="btn btn-secondary" disabled>
            <i className="bi bi-arrow-left"></i> मागे
          </button>
          <button type="button" className="btn btn-primary btn-next" onClick={onNext}>
            पुढे <i className="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>
  )
}

