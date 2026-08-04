'use client'

import { useRef, ChangeEvent } from 'react'
import { FormData, ASSISTIVE_DEVICES } from '../../types/formTypes'

interface DocumentsBenefitsSectionProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  setFieldError: (field: string, message?: string) => void
  errors: Record<string, string>
  existingDocCodes?: Set<string>
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function DocumentsBenefitsSection({
  formData,
  updateFormData,
  setFieldError,
  errors,
  existingDocCodes,
  onPrev,
  onSubmit,
  isSubmitting,
}: DocumentsBenefitsSectionProps) {
  const applicantSignRef = useRef<HTMLInputElement>(null)
  const surveyorSignRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value

    if (field === 'guardianPhone' || field === 'surveyorMobile') {
      value = value.replace(/\D/g, '').slice(0, 10)
    }

    updateFormData(field, value)
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

  const handleFileChange = (field: string, acceptImagesOnly = false) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedFileTypes = acceptImagesOnly
      ? ['image/jpeg', 'image/png', 'image/jpg']
      : ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

    if (!allowedFileTypes.includes(file.type)) {
      setFieldError(field, acceptImagesOnly ? 'कृपया JPG किंवा PNG फाइल निवडा' : 'कृपया PDF, JPG किंवा PNG फाइल निवडा')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldError(field, 'फाइल साइज 5MB पेक्षा कमी असावी')
      e.target.value = ''
      return
    }

    setFieldError(field)
    updateFormData(field, file)
  }

  const handleSignatureChange = (field: string, previewField: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFieldError(field, 'कृपया फक्त इमेज फाइल निवडा')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldError(field, 'सही फाइल साइज 2MB पेक्षा कमी असावी')
      e.target.value = ''
      return
    }

    setFieldError(field)
    updateFormData(field, file)
    const reader = new FileReader()
    reader.onload = (event) => {
      updateFormData(previewField, event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getSelectedFileName = (field: keyof FormData) => {
    const value = formData[field]
    return value instanceof File ? value.name : ''
  }

  const requiredDocStatus: Array<{ code: string; label: string; field: keyof FormData }> = [
    { code: 'UDID_DOC', label: 'दिव्यांग प्रमाणपत्र / स्वावलंबन कार्ड (UDID)', field: 'udidDoc' },
    { code: 'AADHAAR_DOC', label: 'आधारकार्ड', field: 'aadhaarDoc' },
    { code: 'RATION_CARD_DOC', label: 'रेशनकार्ड', field: 'rationCardDoc' },
    { code: 'BANK_DOC', label: 'बँक खाते झेरॉक्स', field: 'bankDoc' },
    { code: 'INCOME_CERTIFICATE_DOC', label: 'उत्पन्न दाखला / वार्षिक आय प्रमाणपत्र', field: 'incomeCertificateDoc' },
    { code: 'PHOTO_DOC', label: 'फोटो', field: 'photoDoc' },
  ]

  const uploadedDocCodes = existingDocCodes ?? new Set<string>()
  const missingDocs = requiredDocStatus.filter(doc => !uploadedDocCodes.has(doc.code))

  return (
    <section className="form-section active" id="section4">
      <div className="section-header">
        <div className="section-heading-block">
          <span className="section-eyebrow">Final review</span>
          <h4><i className="bi bi-file-earmark-check"></i> योजना लाभ व दस्तऐवज</h4>
          <p className="section-description">योजना लाभ, सहाय्यक साहित्य, कागदपत्रे आणि अंतिम घोषणेसाठी हा टप्पा पूर्ण करा.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="form-group-card" style={{ marginBottom: 16 }}>
          <div className="card-label">कागदपत्रे अनिवार्य आहेत</div>
          <p className="section-description" style={{ marginBottom: 0 }}>
            खालील सर्व कागदपत्रे व सही आवश्यक आहेत. कोणतेही कागदपत्र अपूर्ण असल्यास अर्ज पुढे जाऊ शकणार नाही.
          </p>
        </div>

        {existingDocCodes && (
          <div className="form-group-card" id="missing-documents" style={{ marginBottom: 16 }}>
            <div className="card-label">कागदपत्र पडताळणी स्थिती</div>
            {missingDocs.length > 0 ? (
              <div className="alert alert-warning mb-0" role="alert" style={{ fontSize: '0.88rem' }}>
                <strong>अपूर्ण कागदपत्रे:</strong> विभागीय वापरकर्ता खालील कागदपत्रे या स्क्रीनवरून अपलोड/री-अपलोड करू शकतो.
                <ul className="mb-0 mt-2" style={{ paddingLeft: 18 }}>
                  {missingDocs.map((doc) => (
                    <li key={doc.code}>{doc.label}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="alert alert-success mb-0" role="alert" style={{ fontSize: '0.88rem' }}>
                सर्व आवश्यक कागदपत्रे प्रणालीमध्ये आधीपासून उपलब्ध आहेत. नव्या फाइलने री-अपलोड केल्यास जुनी फाइल बदलली जाईल.
              </div>
            )}
          </div>
        )}

        <div className="form-group-card">
          <div className="card-label">22. यापूर्वी कोणत्या शासकीय योजनेचा लाभ घेतला आहे काय? <span className="required">*</span></div>
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
            {errors.hasGovtBenefit && <div className="invalid-feedback d-block mt-1">{errors.hasGovtBenefit}</div>}
            {formData.hasGovtBenefit === 'होय' && (
              <div className="col-12">
                <label className="form-label">असल्यास कोणत्या योजनेतून</label>
                <textarea
                  className={`form-control ${errors.govtBenefitScheme ? 'is-invalid' : ''}`}
                  rows={2}
                  value={formData.govtBenefitScheme}
                  onChange={handleInputChange('govtBenefitScheme')}
                  placeholder="योजनेचे नाव प्रविष्ट करा"
                />
                {errors.govtBenefitScheme && <div className="invalid-feedback">{errors.govtBenefitScheme}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="form-group-card">
          <div className="card-label">23. यापूर्वी महानगरपालिका कडून दिव्यांग योजनेचा लाभ घेतला आहे काय? <span className="required">*</span></div>
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
            {errors.hasMCBenefit && <div className="invalid-feedback d-block mt-1">{errors.hasMCBenefit}</div>}
            {formData.hasMCBenefit === 'होय' && (
              <div className="col-12">
                <label className="form-label">असल्यास</label>
                <textarea
                  className={`form-control ${errors.mcBenefitDetails ? 'is-invalid' : ''}`}
                  rows={2}
                  value={formData.mcBenefitDetails}
                  onChange={handleInputChange('mcBenefitDetails')}
                  placeholder="तपशील प्रविष्ट करा"
                />
                {errors.mcBenefitDetails && <div className="invalid-feedback">{errors.mcBenefitDetails}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Sanjay Gandhi Pension */}
        <div className="form-group-card">
          <div className="card-label">24. संजय गांधी निराधार पेंशन योजनेतर्गत पेंशन सुरु आहे काय? <span className="required">*</span></div>
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
          {errors.hasSGNPension && <div className="invalid-feedback d-block mt-2">{errors.hasSGNPension}</div>}
        </div>

        {/* Housing */}
        <div className="form-group-card">
          <div className="card-label">25. घराबाबत माहिती</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">स्वतःचे घर आहे काय? <span className="required">*</span></label>
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
              {errors.hasOwnHouse && <div className="invalid-feedback d-block mt-2">{errors.hasOwnHouse}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">घरकुल योजनेतून लाभ हवा आहे काय? <span className="required">*</span></label>
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
              {errors.wantsHousingBenefit && <div className="invalid-feedback d-block mt-2">{errors.wantsHousingBenefit}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">स्वतःच्या नावावर जागा आहे काय? <span className="required">*</span></label>
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
              {errors.hasOwnLand && <div className="invalid-feedback d-block mt-2">{errors.hasOwnLand}</div>}
            </div>
          </div>
        </div>

        {/* Guardianship */}
        <div className="form-group-card">
          <div className="card-label">26. मतीमंद असल्यास 18 वर्षे पूर्ण होऊन पालकत्व प्रमाणपत्र घेतले आहे काय? <span className="required">*</span></div>
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
            {errors.hasGuardianship && <div className="invalid-feedback d-block mt-1">{errors.hasGuardianship}</div>}
            {formData.hasGuardianship === 'होय' && (
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">पालकत्व असल्यास नाव</label>
                    <input
                      type="text"
                      className={`form-control ${errors.guardianName ? 'is-invalid' : ''}`}
                      value={formData.guardianName}
                      onChange={handleInputChange('guardianName')}
                      placeholder="पालकाचे नाव"
                    />
                    {errors.guardianName && <div className="invalid-feedback">{errors.guardianName}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">पत्ता</label>
                    <textarea
                      className={`form-control ${errors.guardianAddress ? 'is-invalid' : ''}`}
                      rows={2}
                      value={formData.guardianAddress}
                      onChange={handleInputChange('guardianAddress')}
                      placeholder="पालकाचा पत्ता"
                    />
                    {errors.guardianAddress && <div className="invalid-feedback">{errors.guardianAddress}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">संपर्क क्रमांक</label>
                    <input
                      type="tel"
                      className={`form-control ${errors.guardianPhone ? 'is-invalid' : ''}`}
                      value={formData.guardianPhone}
                      onChange={handleInputChange('guardianPhone')}
                      placeholder="संपर्क क्रमांक"
                      inputMode="numeric"
                    />
                    {errors.guardianPhone && <div className="invalid-feedback">{errors.guardianPhone}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assistive Devices */}
        <div className="form-group-card">
          <div className="card-label">27. दिव्यांग साहित्य आवश्यक आहे काय? <span className="required">*</span></div>
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
            {errors.needsAssistiveDevice && <div className="invalid-feedback d-block mt-1">{errors.needsAssistiveDevice}</div>}
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
                {errors.assistiveDevices && <div className="invalid-feedback d-block mt-2">{errors.assistiveDevices}</div>}
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
          {errors.documentsSubmitted && <div className="invalid-feedback d-block mt-2">{errors.documentsSubmitted}</div>}
        </div>

        <div className="form-group-card">
          <div className="card-label"><i className="bi bi-paperclip"></i> फॉर्म सोबत खालील आवश्यक कागदपत्रे जोडावीत <span className="required">*</span></div>
          <div className="document-upload-section">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">1) दिव्यांग प्रमाणपत्र / स्वावलंबन कार्ड (UDID) <span className="required">*</span></label>
                  {uploadedDocCodes.has('UDID_DOC') ? (
                    <div className="form-text text-success mb-1">आधीची फाइल उपलब्ध आहे. नव्या फाइलने री-अपलोड करू शकता.</div>
                  ) : (
                    <div className="form-text text-danger mb-1">ही फाइल उपलब्ध नाही. कृपया अपलोड करा.</div>
                  )}
                  <input
                    type="file"
                    className={`form-control ${errors.udidDoc ? 'is-invalid' : ''}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('udidDoc')}
                  />
                  {getSelectedFileName('udidDoc') ? <div className="form-text">निवडलेली फाइल: {getSelectedFileName('udidDoc')}</div> : null}
                  {errors.udidDoc && <div className="invalid-feedback">{errors.udidDoc}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">2) आधारकार्ड <span className="required">*</span></label>
                  {uploadedDocCodes.has('AADHAAR_DOC') ? (
                    <div className="form-text text-success mb-1">आधीची फाइल उपलब्ध आहे. नव्या फाइलने री-अपलोड करू शकता.</div>
                  ) : (
                    <div className="form-text text-danger mb-1">ही फाइल उपलब्ध नाही. कृपया अपलोड करा.</div>
                  )}
                  <input
                    type="file"
                    className={`form-control ${errors.aadhaarDoc ? 'is-invalid' : ''}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('aadhaarDoc')}
                  />
                  {getSelectedFileName('aadhaarDoc') ? <div className="form-text">निवडलेली फाइल: {getSelectedFileName('aadhaarDoc')}</div> : null}
                  {errors.aadhaarDoc && <div className="invalid-feedback">{errors.aadhaarDoc}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">3) रेशनकार्ड <span className="required">*</span></label>
                  {uploadedDocCodes.has('RATION_CARD_DOC') ? (
                    <div className="form-text text-success mb-1">आधीची फाइल उपलब्ध आहे. नव्या फाइलने री-अपलोड करू शकता.</div>
                  ) : (
                    <div className="form-text text-danger mb-1">ही फाइल उपलब्ध नाही. कृपया अपलोड करा.</div>
                  )}
                  <input
                    type="file"
                    className={`form-control ${errors.rationCardDoc ? 'is-invalid' : ''}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('rationCardDoc')}
                  />
                  {getSelectedFileName('rationCardDoc') ? <div className="form-text">निवडलेली फाइल: {getSelectedFileName('rationCardDoc')}</div> : null}
                  {errors.rationCardDoc && <div className="invalid-feedback">{errors.rationCardDoc}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">4) बँक खाते झेरॉक्स <span className="required">*</span></label>
                  {uploadedDocCodes.has('BANK_DOC') ? (
                    <div className="form-text text-success mb-1">आधीची फाइल उपलब्ध आहे. नव्या फाइलने री-अपलोड करू शकता.</div>
                  ) : (
                    <div className="form-text text-danger mb-1">ही फाइल उपलब्ध नाही. कृपया अपलोड करा.</div>
                  )}
                  <input
                    type="file"
                    className={`form-control ${errors.bankDoc ? 'is-invalid' : ''}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('bankDoc')}
                  />
                  {getSelectedFileName('bankDoc') ? <div className="form-text">निवडलेली फाइल: {getSelectedFileName('bankDoc')}</div> : null}
                  {errors.bankDoc && <div className="invalid-feedback">{errors.bankDoc}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">5) उत्पन्न दाखला / वार्षिक आय प्रमाणपत्र <span className="required">*</span></label>
                  {uploadedDocCodes.has('INCOME_CERTIFICATE_DOC') ? (
                    <div className="form-text text-success mb-1">आधीची फाइल उपलब्ध आहे. नव्या फाइलने री-अपलोड करू शकता.</div>
                  ) : (
                    <div className="form-text text-danger mb-1">ही फाइल उपलब्ध नाही. कृपया अपलोड करा.</div>
                  )}
                  <input
                    type="file"
                    className={`form-control ${errors.incomeCertificateDoc ? 'is-invalid' : ''}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange('incomeCertificateDoc')}
                  />
                  {getSelectedFileName('incomeCertificateDoc') ? <div className="form-text">निवडलेली फाइल: {getSelectedFileName('incomeCertificateDoc')}</div> : null}
                  {errors.incomeCertificateDoc && <div className="invalid-feedback">{errors.incomeCertificateDoc}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="upload-item">
                  <label className="form-label">6) फोटो <span className="required">*</span></label>
                  {uploadedDocCodes.has('PHOTO_DOC') ? (
                    <div className="form-text text-success mb-1">आधीचा फोटो उपलब्ध आहे. नव्या फाइलने री-अपलोड करू शकता.</div>
                  ) : (
                    <div className="form-text text-danger mb-1">फोटो उपलब्ध नाही. कृपया अपलोड करा.</div>
                  )}
                  <input
                    type="file"
                    className={`form-control ${errors.photoDoc ? 'is-invalid' : ''}`}
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange('photoDoc', true)}
                  />
                  {getSelectedFileName('photoDoc') ? <div className="form-text">निवडलेली फाइल: {getSelectedFileName('photoDoc')}</div> : null}
                  {errors.photoDoc && <div className="invalid-feedback">{errors.photoDoc}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-group-card signature-section">
          <div className="row">
            <div className="col-md-6">
              <div className="signature-box">
                <h6>दिव्यांग व्यक्तीचे नांव</h6>
                <div className="mt-3">
                  <label className="form-label">सही: <span className="required">*</span></label>
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
                    {getSelectedFileName('applicantSignature') ? <div className="form-text text-center">निवडलेली फाइल: {getSelectedFileName('applicantSignature')}</div> : null}
                  </div>
                  {errors.applicantSignature && <div className="invalid-feedback d-block mt-2">{errors.applicantSignature}</div>}
                </div>
                <div className="mt-3">
                  <label className="form-label">दिनांक:</label>
                  <input
                    type="date"
                    className={`form-control form-control-sm ${errors.applicantSignDate ? 'is-invalid' : ''}`}
                    value={formData.applicantSignDate}
                    onChange={handleInputChange('applicantSignDate')}
                  />
                  {errors.applicantSignDate && <div className="invalid-feedback">{errors.applicantSignDate}</div>}
                </div>
              </div>
            </div>
            {/* Surveyor section — hidden, re-enable by changing false to true */}
            {false && (
            <div className="col-md-6">
              <div className="signature-box">
                <h6>सर्वेक्षण करणाऱ्याचे नाव</h6>
                <input
                  type="text"
                  className={`form-control mb-2 ${errors.surveyorName ? 'is-invalid' : ''}`}
                  value={formData.surveyorName}
                  onChange={handleInputChange('surveyorName')}
                  placeholder="सर्वेक्षकाचे नाव"
                />
                {errors.surveyorName && <div className="invalid-feedback d-block mb-2">{errors.surveyorName}</div>}
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">हुद्दा:</label>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${errors.surveyorDesignation ? 'is-invalid' : ''}`}
                      value={formData.surveyorDesignation}
                      onChange={handleInputChange('surveyorDesignation')}
                      placeholder="हुद्दा"
                    />
                    {errors.surveyorDesignation && <div className="invalid-feedback">{errors.surveyorDesignation}</div>}
                  </div>
                  <div className="col-6">
                    <label className="form-label">मोबाईल क्र.:</label>
                    <input
                      type="tel"
                      className={`form-control form-control-sm ${errors.surveyorMobile ? 'is-invalid' : ''}`}
                      value={formData.surveyorMobile}
                      onChange={handleInputChange('surveyorMobile')}
                      placeholder="मोबाईल क्र."
                      inputMode="numeric"
                    />
                    {errors.surveyorMobile && <div className="invalid-feedback">{errors.surveyorMobile}</div>}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label">सही: <span className="required">*</span></label>
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
                    {getSelectedFileName('surveyorSignature') ? <div className="form-text text-center">निवडलेली फाइल: {getSelectedFileName('surveyorSignature')}</div> : null}
                  </div>
                  {errors.surveyorSignature && <div className="invalid-feedback d-block mt-2">{errors.surveyorSignature}</div>}
                </div>
              </div>
            </div>
            )}
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

