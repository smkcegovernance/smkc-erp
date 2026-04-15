'use client'

import { ChangeEvent } from 'react'
import { FormData, DISABILITY_TYPES, EMPLOYMENT_TYPE_OPTIONS } from '../../types/formTypes'

interface DisabilityInfoSectionProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
  onNext: () => void
  onPrev: () => void
}

export default function DisabilityInfoSection({
  formData,
  updateFormData,
  errors,
  onNext,
  onPrev,
}: DisabilityInfoSectionProps) {
  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value

    if (field === 'disabilityPercentage') {
      value = value.replace(/\D/g, '').slice(0, 3)
    }

    updateFormData(field, value)
  }

  const handleDisabilityTypeChange = (value: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const currentTypes = formData.disabilityTypes || []
    if (e.target.checked) {
      updateFormData('disabilityTypes', [...currentTypes, value])
    } else {
      updateFormData('disabilityTypes', currentTypes.filter((t: string) => t !== value))
    }
  }

  return (
    <section className="form-section active" id="section3">
      <div className="section-header">
        <div className="section-heading-block">
          <span className="section-eyebrow">Disability profile</span>
          <h4><i className="bi bi-clipboard2-pulse"></i> दिव्यांगत्व माहिती</h4>
          <p className="section-description">प्रवर्ग, प्रमाणपत्रे, प्रवास सवलत आणि रोजगाराशी संबंधित माहिती पूर्ण करा.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="form-group-card">
          <div className="card-label">
            14. दिव्यांगत्वाचा / अपंगत्वाचा प्रकार / प्रवर्ग <span className="required">*</span>
          </div>
          <p className="text-muted small mb-3">खालीलपैकी दिव्यांगत्वाचा / अपंगत्वाचा प्रकार येथे नमूद करा</p>
          {errors.disabilityTypes && <div className="text-danger small mb-3">{errors.disabilityTypes}</div>}
          {formData.disabilityTypes.length > 0 && (
            <div className="selection-summary">निवडलेले प्रकार: {formData.disabilityTypes.length}</div>
          )}
          <div className="row g-2">
            {DISABILITY_TYPES.map((type) => (
              <div key={type.id} className="col-md-6 col-lg-4">
                <div className="form-check custom-checkbox">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`disability-${type.id}`}
                    value={type.value}
                    checked={formData.disabilityTypes?.includes(type.value)}
                    onChange={handleDisabilityTypeChange(type.value)}
                  />
                  <label className="form-check-label" htmlFor={`disability-${type.id}`}>
                    {type.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disability Certificate */}
        <div className="form-group-card">
          <div className="card-label">15. जिल्हा वैद्यकीय मंडळ यांचा अपंगत्वाचा दाखला आहे काय? <span className="required">*</span></div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['आहे', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasCertificate"
                      id={`cert-${option}`}
                      value={option}
                      checked={formData.hasCertificate === option}
                      onChange={handleInputChange('hasCertificate')}
                    />
                    <label className="form-check-label" htmlFor={`cert-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.hasCertificate && <div className="invalid-feedback d-block mt-1">{errors.hasCertificate}</div>}
            {formData.hasCertificate === 'आहे' && (
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">अ) दाखला क्रमांक</label>
                    <input
                      type="text"
                      className={`form-control ${errors.certificateNumber ? 'is-invalid' : ''}`}
                      value={formData.certificateNumber}
                      onChange={handleInputChange('certificateNumber')}
                      placeholder="दाखला क्रमांक"
                    />
                    {errors.certificateNumber && <div className="invalid-feedback">{errors.certificateNumber}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">आ) दाखल्याचा दिनांक</label>
                    <input
                      type="date"
                      className={`form-control ${errors.certificateDate ? 'is-invalid' : ''}`}
                      value={formData.certificateDate}
                      onChange={handleInputChange('certificateDate')}
                    />
                    {errors.certificateDate && <div className="invalid-feedback">{errors.certificateDate}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">इ) दाखल्याचा प्रकार</label>
                    <select
                      className={`form-select ${errors.certificateType ? 'is-invalid' : ''}`}
                      value={formData.certificateType}
                      onChange={handleInputChange('certificateType')}
                    >
                      <option value="">निवडा</option>
                      <option value="तात्पुरता">तात्पुरता</option>
                      <option value="कायमस्वरूपी">कायमस्वरूपी</option>
                    </select>
                    {errors.certificateType && <div className="invalid-feedback">{errors.certificateType}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">ई) दाखला असल्यास टक्केवारी</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className={`form-control ${errors.disabilityPercentage ? 'is-invalid' : ''}`}
                        value={formData.disabilityPercentage}
                        onChange={handleInputChange('disabilityPercentage')}
                        placeholder="टक्केवारी"
                        inputMode="numeric"
                      />
                      <span className="input-group-text">%</span>
                    </div>
                    {errors.disabilityPercentage && <div className="invalid-feedback d-block">{errors.disabilityPercentage}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* UDID Card */}
        <div className="form-group-card">
          <div className="card-label">16. स्वावलंबन कार्ड (UDID Card) आहे काय? <span className="required">*</span></div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['आहे', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasUDID"
                      id={`udid-${option}`}
                      value={option}
                      checked={formData.hasUDID === option}
                      onChange={handleInputChange('hasUDID')}
                    />
                    <label className="form-check-label" htmlFor={`udid-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.hasUDID && <div className="invalid-feedback d-block mt-1">{errors.hasUDID}</div>}
            {formData.hasUDID === 'आहे' && (
              <div className="col-md-6">
                <label className="form-label">असल्यास नंबर / क्रमांक</label>
                <input
                  type="text"
                  className={`form-control ${errors.udidNumber ? 'is-invalid' : ''}`}
                  value={formData.udidNumber}
                  onChange={handleInputChange('udidNumber')}
                  placeholder="UDID नंबर"
                />
                {errors.udidNumber && <div className="invalid-feedback">{errors.udidNumber}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Travel Passes */}
        <div className="form-group-card">
          <div className="card-label">प्रवास सवलत पास माहिती</div>
          
          {/* ST Pass */}
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label fw-semibold">17. एस टी प्रवास सवलत पास आहे काय? <span className="required">*</span></label>
              <div className="btn-group-toggle">
                {['आहे', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasSTPass"
                      id={`stpass-${option}`}
                      value={option}
                      checked={formData.hasSTPass === option}
                      onChange={handleInputChange('hasSTPass')}
                    />
                    <label className="form-check-label" htmlFor={`stpass-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.hasSTPass && <div className="invalid-feedback d-block mt-1">{errors.hasSTPass}</div>}
            {formData.hasSTPass === 'आहे' && (
              <div className="col-md-6">
                <label className="form-label">असल्यास नंबर / क्रमांक</label>
                <input
                  type="text"
                  className={`form-control ${errors.stPassNumber ? 'is-invalid' : ''}`}
                  value={formData.stPassNumber}
                  onChange={handleInputChange('stPassNumber')}
                  placeholder="ST पास नंबर"
                />
                {errors.stPassNumber && <div className="invalid-feedback">{errors.stPassNumber}</div>}
              </div>
            )}
          </div>

          {/* Railway Pass */}
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label fw-semibold">18. रेल्वे प्रवास सवलत पास आहे काय? <span className="required">*</span></label>
              <div className="btn-group-toggle">
                {['आहे', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasRailwayPass"
                      id={`railwaypass-${option}`}
                      value={option}
                      checked={formData.hasRailwayPass === option}
                      onChange={handleInputChange('hasRailwayPass')}
                    />
                    <label className="form-check-label" htmlFor={`railwaypass-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.hasRailwayPass && <div className="invalid-feedback d-block mt-1">{errors.hasRailwayPass}</div>}
            {formData.hasRailwayPass === 'आहे' && (
              <div className="col-md-6">
                <label className="form-label">असल्यास नंबर / क्रमांक</label>
                <input
                  type="text"
                  className={`form-control ${errors.railwayPassNumber ? 'is-invalid' : ''}`}
                  value={formData.railwayPassNumber}
                  onChange={handleInputChange('railwayPassNumber')}
                  placeholder="रेल्वे पास नंबर"
                />
                {errors.railwayPassNumber && <div className="invalid-feedback">{errors.railwayPassNumber}</div>}
              </div>
            )}
          </div>

          {/* MSRTC Pass */}
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">19. एस.टी. प्रवास सवलत पास आहे काय? <span className="required">*</span></label>
              <div className="btn-group-toggle">
                {['आहे', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasMSRTCPass"
                      id={`msrtcpass-${option}`}
                      value={option}
                      checked={formData.hasMSRTCPass === option}
                      onChange={handleInputChange('hasMSRTCPass')}
                    />
                    <label className="form-check-label" htmlFor={`msrtcpass-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.hasMSRTCPass && <div className="invalid-feedback d-block mt-1">{errors.hasMSRTCPass}</div>}
            {formData.hasMSRTCPass === 'आहे' && (
              <div className="col-md-6">
                <label className="form-label">असल्यास नंबर / क्रमांक</label>
                <input
                  type="text"
                  className={`form-control ${errors.msrtcPassNumber ? 'is-invalid' : ''}`}
                  value={formData.msrtcPassNumber}
                  onChange={handleInputChange('msrtcPassNumber')}
                  placeholder="एस.टी. पास नंबर"
                />
                {errors.msrtcPassNumber && <div className="invalid-feedback">{errors.msrtcPassNumber}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Employment */}
        <div className="form-group-card">
          <div className="card-label">20. नोकरीत आहे काय? <span className="required">*</span></div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['आहे', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="isEmployed"
                      id={`employed-${option}`}
                      value={option}
                      checked={formData.isEmployed === option}
                      onChange={handleInputChange('isEmployed')}
                    />
                    <label className="form-check-label" htmlFor={`employed-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {errors.isEmployed && <div className="invalid-feedback d-block mt-1">{errors.isEmployed}</div>}
            {formData.isEmployed === 'आहे' && (
              <div className="col-12">
                <label className="form-label">असल्यास प्रकार</label>
                <div className="btn-group-toggle">
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                    <div key={option.value} className="form-check form-check-inline custom-radio">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="employmentType"
                        id={`emptype-${option.value}`}
                        value={option.value}
                        checked={formData.employmentType === option.value}
                        onChange={handleInputChange('employmentType')}
                      />
                      <label className="form-check-label" htmlFor={`emptype-${option.value}`}>
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.employmentType && <div className="invalid-feedback d-block">{errors.employmentType}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Occupation */}
        <div className="form-group-card">
          <div className="card-label">21. व्यवसाय</div>
          <div className="row g-3">
            <div className="col-12">
              <input
                type="text"
                className={`form-control ${errors.occupation ? 'is-invalid' : ''}`}
                value={formData.occupation}
                onChange={handleInputChange('occupation')}
                placeholder="व्यवसाय प्रविष्ट करा"
              />
              {errors.occupation && <div className="invalid-feedback">{errors.occupation}</div>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="form-navigation">
          <button type="button" className="btn btn-secondary btn-prev" onClick={onPrev}>
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

