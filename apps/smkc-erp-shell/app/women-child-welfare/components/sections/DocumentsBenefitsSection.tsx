'use client'

import { useRef, ChangeEvent } from 'react'
import { FormData, ASSISTIVE_DEVICES } from '../../types/formTypes'

interface DocumentsBenefitsSectionProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function DocumentsBenefitsSection({
  formData,
  updateFormData,
  errors,
  onPrev,
  onSubmit,
  isSubmitting,
}: DocumentsBenefitsSectionProps) {
  const applicantSignRef = useRef<HTMLInputElement>(null)
  const surveyorSignRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData(field, e.target.value)
  }

  const handleCheckboxChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    updateFormData(field, e.target.checked)
  }

  const handleDeviceChange = (value: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const currentDevices = formData.assistiveDevices || []
    if (e.target.checked) {
      updateFormData('assistiveDevices', [...currentDevices, value])
    } else {
      updateFormData('assistiveDevices', currentDevices.filter((d: string) => d !== value))
    }
  }

  const handleFileChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData(field, file)
    }
  }

  const handleSignatureChange = (field: string, previewField: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('कृपया फक्त इमेज फाइल निवडा')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('फाइल साइज 2MB पेक्षा कमी असावी')
        return
      }
      updateFormData(field, file)
      const reader = new FileReader()
      reader.onload = (e) => {
        updateFormData(previewField, e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <section className="form-section active" id="section4">
      <div className="section-header">
        <h4><i className="bi bi-file-earmark-check"></i> योजना लाभ व दस्तऐवज</h4>
      </div>
      <div className="section-body">
        {/* Government Scheme Benefits */}
        <div className="form-group-card">
          <div className="card-label">22. यापूर्वी कोणत्या शासकीय योजनेचा लाभ घेतला आहे काय?</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasGovtBenefit"
                      id={`govtbenefit-${option}`}
                      value={option}
                      checked={formData.hasGovtBenefit === option}
                      onChange={handleInputChange('hasGovtBenefit')}
                    />
                    <label className="form-check-label" htmlFor={`govtbenefit-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {formData.hasGovtBenefit === 'होय' && (
              <div className="col-12">
                <label className="form-label">असल्यास कोणत्या योजनेतून</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.govtBenefitScheme}
                  onChange={handleInputChange('govtBenefitScheme')}
                  placeholder="योजनेचे नाव प्रविष्ट करा"
                />
              </div>
            )}
          </div>
        </div>

        {/* Municipal Corporation Benefits */}
        <div className="form-group-card">
          <div className="card-label">23. यापूर्वी महानगरपालिका कडून दिव्यांग योजनेचा लाभ घेतला आहे काय?</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasMCBenefit"
                      id={`mcbenefit-${option}`}
                      value={option}
                      checked={formData.hasMCBenefit === option}
                      onChange={handleInputChange('hasMCBenefit')}
                    />
                    <label className="form-check-label" htmlFor={`mcbenefit-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {formData.hasMCBenefit === 'होय' && (
              <div className="col-12">
                <label className="form-label">असल्यास</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.mcBenefitDetails}
                  onChange={handleInputChange('mcBenefitDetails')}
                  placeholder="तपशील प्रविष्ट करा"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sanjay Gandhi Pension */}
        <div className="form-group-card">
          <div className="card-label">24. संजय गांधी निराधार पेंशन योजनेतर्गत पेंशन सुरु आहे काय?</div>
          <div className="btn-group-toggle">
            {['होय', 'नाही'].map((option) => (
              <div key={option} className="form-check form-check-inline custom-radio">
                <input
                  className="form-check-input"
                  type="radio"
                  name="hasSGNPension"
                  id={`sgnpension-${option}`}
                  value={option}
                  checked={formData.hasSGNPension === option}
                  onChange={handleInputChange('hasSGNPension')}
                />
                <label className="form-check-label" htmlFor={`sgnpension-${option}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Housing */}
        <div className="form-group-card">
          <div className="card-label">25. घराबाबत माहिती</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">स्वतःचे घर आहे काय?</label>
              <div className="btn-group-toggle">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasOwnHouse"
                      id={`house-${option}`}
                      value={option}
                      checked={formData.hasOwnHouse === option}
                      onChange={handleInputChange('hasOwnHouse')}
                    />
                    <label className="form-check-label" htmlFor={`house-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">घरकुल योजनेतून लाभ हवा आहे काय?</label>
              <div className="btn-group-toggle">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="wantsHousingBenefit"
                      id={`housingbenefit-${option}`}
                      value={option}
                      checked={formData.wantsHousingBenefit === option}
                      onChange={handleInputChange('wantsHousingBenefit')}
                    />
                    <label className="form-check-label" htmlFor={`housingbenefit-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">स्वतःच्या नावावर जागा आहे काय?</label>
              <div className="btn-group-toggle">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasOwnLand"
                      id={`land-${option}`}
                      value={option}
                      checked={formData.hasOwnLand === option}
                      onChange={handleInputChange('hasOwnLand')}
                    />
                    <label className="form-check-label" htmlFor={`land-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Guardianship */}
        <div className="form-group-card">
          <div className="card-label">26. मतीमंद असल्यास 18 वर्षे पूर्ण होऊन पालकत्व प्रमाणपत्र घेतले आहे काय?</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="hasGuardianship"
                      id={`guardianship-${option}`}
                      value={option}
                      checked={formData.hasGuardianship === option}
                      onChange={handleInputChange('hasGuardianship')}
                    />
                    <label className="form-check-label" htmlFor={`guardianship-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {formData.hasGuardianship === 'होय' && (
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">पालकत्व असल्यास नाव</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.guardianName}
                      onChange={handleInputChange('guardianName')}
                      placeholder="पालकाचे नाव"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">पत्ता</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.guardianAddress}
                      onChange={handleInputChange('guardianAddress')}
                      placeholder="पालकाचा पत्ता"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">संपर्क क्रमांक</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.guardianPhone}
                      onChange={handleInputChange('guardianPhone')}
                      placeholder="संपर्क क्रमांक"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assistive Devices */}
        <div className="form-group-card">
          <div className="card-label">27. दिव्यांग साहित्य आवश्यक आहे काय?</div>
          <div className="row g-3">
            <div className="col-12">
              <div className="btn-group-toggle mb-3">
                {['होय', 'नाही'].map((option) => (
                  <div key={option} className="form-check form-check-inline custom-radio">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="needsAssistiveDevice"
                      id={`device-${option}`}
                      value={option}
                      checked={formData.needsAssistiveDevice === option}
                      onChange={handleInputChange('needsAssistiveDevice')}
                    />
                    <label className="form-check-label" htmlFor={`device-${option}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {formData.needsAssistiveDevice === 'होय' && (
              <div className="col-12">
                <label className="form-label mb-2">असल्यास कोणते साहित्य आवश्यक आहे</label>
                <div className="row g-2">
                  {ASSISTIVE_DEVICES.map((device) => (
                    <div key={device.id} className="col-md-4">
                      <div className="form-check custom-checkbox">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={device.id}
                          value={device.value}
                          checked={formData.assistiveDevices?.includes(device.value)}
                          onChange={handleDeviceChange(device.value)}
                        />
                        <label className="form-check-label" htmlFor={device.id}>
                          {device.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Submission */}
        <div className="form-group-card">
          <div className="card-label">28. नोंदणी फॉर्म सोबत दिव्यांग प्रमाणपत्र / स्वावलंबन कार्ड ची प्रत सादर केली आहे काय?</div>
          <div className="btn-group-toggle">
            {['होय', 'नाही'].map((option) => (
              <div key={option} className="form-check form-check-inline custom-radio">
                <input
                  className="form-check-input"
                  type="radio"
                  name="documentsSubmitted"
                  id={`docs-${option}`}
                  value={option}
                  checked={formData.documentsSubmitted === option}
                  onChange={handleInputChange('documentsSubmitted')}
                />
                <label className="form-check-label" htmlFor={`docs-${option}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Document Uploads */}
        <div className="form-group-card">
          <div className="card-label"><i className="bi bi-paperclip"></i> फॉर्म सोबत खालील आवश्यक कागदपत्रे जोडावीत</div>
          <div className="document-upload-section">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">1) दिव्यांग प्रमाणपत्र / स्वावलंबन कार्ड (UDID)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('udidDoc')}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">2) आधारकार्ड / रेशनकार्ड</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('aadhaarDoc')}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">3) बँक खाते झेरॉक्स</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('bankDoc')}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">4) फोटो</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange('photoDoc')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="form-group-card signature-section">
          <div className="row">
            <div className="col-md-6">
              <div className="signature-box">
                <h6>दिव्यांग व्यक्तीचे नांव</h6>
                <div className="mt-3">
                  <label className="form-label">सही:</label>
                  <div className="signature-upload-container">
                    <div
                      className="signature-preview"
                      onClick={() => applicantSignRef.current?.click()}
                    >
                      {formData.applicantSignaturePreview ? (
                        <img src={formData.applicantSignaturePreview} alt="Signature Preview" />
                      ) : (
                        <>
                          <i className="bi bi-pen"></i>
                          <span>सही अपलोड करा</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={applicantSignRef}
                      accept="image/*"
                      className="d-none"
                      onChange={handleSignatureChange('applicantSignature', 'applicantSignaturePreview')}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm mt-2"
                      onClick={() => applicantSignRef.current?.click()}
                    >
                      <i className="bi bi-upload"></i> सही अपलोड करा
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label">दिनांक:</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={formData.applicantSignDate}
                    onChange={handleInputChange('applicantSignDate')}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="signature-box">
                <h6>सर्वेक्षण करणाऱ्याचे नाव</h6>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={formData.surveyorName}
                  onChange={handleInputChange('surveyorName')}
                  placeholder="सर्वेक्षकाचे नाव"
                />
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">हुद्दा:</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.surveyorDesignation}
                      onChange={handleInputChange('surveyorDesignation')}
                      placeholder="हुद्दा"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">मोबाईल क्र.:</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      value={formData.surveyorMobile}
                      onChange={handleInputChange('surveyorMobile')}
                      placeholder="मोबाईल क्र."
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label">सही:</label>
                  <div className="signature-upload-container">
                    <div
                      className="signature-preview"
                      onClick={() => surveyorSignRef.current?.click()}
                    >
                      {formData.surveyorSignaturePreview ? (
                        <img src={formData.surveyorSignaturePreview} alt="Surveyor Signature" />
                      ) : (
                        <>
                          <i className="bi bi-pen"></i>
                          <span>सही अपलोड करा</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={surveyorSignRef}
                      accept="image/*"
                      className="d-none"
                      onChange={handleSignatureChange('surveyorSignature', 'surveyorSignaturePreview')}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm mt-2"
                      onClick={() => surveyorSignRef.current?.click()}
                    >
                      <i className="bi bi-upload"></i> सही अपलोड करा
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="form-group-card">
          <div className={`form-check mb-3 ${errors.termsAccepted ? 'is-invalid' : ''}`}>
            <input
              className={`form-check-input ${errors.termsAccepted ? 'is-invalid' : ''}`}
              type="checkbox"
              id="termsCheck"
              checked={formData.termsAccepted}
              onChange={handleCheckboxChange('termsAccepted')}
            />
            <label className="form-check-label" htmlFor="termsCheck">
              मी प्रमाणित करतो/करते की वर दिलेली माहिती खरी आणि अचूक आहे. <span className="required">*</span>
            </label>
            {errors.termsAccepted && (
              <div className="invalid-feedback d-block">{errors.termsAccepted}</div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="form-navigation">
          <button type="button" className="btn btn-secondary btn-prev" onClick={onPrev}>
            <i className="bi bi-arrow-left"></i> मागे
          </button>
          <button
            type="button"
            className={`btn btn-success btn-submit ${isSubmitting ? 'loading' : ''}`}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                प्रक्रिया करत आहे...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i> फॉर्म सबमिट करा
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

