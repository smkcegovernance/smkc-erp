'use client'

import { ChangeEvent } from 'react'
import { FormData } from '../../types/formTypes'

interface AddressContactSectionProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
  onNext: () => void
  onPrev: () => void
}

export default function AddressContactSection({
  formData,
  updateFormData,
  errors,
  onNext,
  onPrev,
}: AddressContactSectionProps) {
  const handleInputChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value
    
    if (field === 'mobileNumber' || field === 'pincode' || field === 'alternatePhone' || field === 'accountNumber' || field === 'bplYear') {
      value = value.replace(/\D/g, '')
      if (field === 'mobileNumber') value = value.slice(0, 10)
      if (field === 'pincode') value = value.slice(0, 6)
      if (field === 'alternatePhone') value = value.slice(0, 10)
      if (field === 'accountNumber') value = value.slice(0, 18)
      if (field === 'bplYear') value = value.slice(0, 4)
    }
    if (field === 'ifscCode') {
      value = value.toUpperCase()
    }
    
    updateFormData(field, value)
  }

  return (
    <section className="form-section active" id="section2">
      <div className="section-header">
        <div className="section-heading-block">
          <span className="section-eyebrow">Address and outreach</span>
          <h4><i className="bi bi-geo-alt"></i> पत्ता व संपर्क माहिती</h4>
          <p className="section-description">संपर्कासाठी वापरला जाणारा पत्ता, मोबाईल आणि ऐच्छिक बँक माहिती द्या.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="form-group-card">
          <div className="card-label">2. पत्ता</div>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">पूर्ण पत्ता <span className="required">*</span></label>
              <textarea
                className={`form-control ${errors.fullAddress ? 'is-invalid' : ''}`}
                rows={2}
                value={formData.fullAddress}
                onChange={handleInputChange('fullAddress')}
                placeholder="पूर्ण पत्ता प्रविष्ट करा"
              />
              {errors.fullAddress && <div className="invalid-feedback">{errors.fullAddress}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">वॉर्ड नंबर / नाव</label>
              <input
                type="text"
                className="form-control"
                value={formData.wardNumber}
                onChange={handleInputChange('wardNumber')}
                placeholder="वॉर्ड नंबर / नाव"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">प्रभाग समिति क्र.</label>
              <input
                type="text"
                className="form-control"
                value={formData.prabhagSamiti}
                onChange={handleInputChange('prabhagSamiti')}
                placeholder="प्रभाग समिति क्र."
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">UPHC नाव व नंबर</label>
              <input
                type="text"
                className="form-control"
                value={formData.uphc}
                onChange={handleInputChange('uphc')}
                placeholder="UPHC नाव व नंबर"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">पिनकोड <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.pincode ? 'is-invalid' : ''}`}
                value={formData.pincode}
                onChange={handleInputChange('pincode')}
                placeholder="6 अंकी पिनकोड"
                maxLength={6}
              />
              {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">विधानसभा मतदार संघ</label>
              <input
                type="text"
                className="form-control"
                value={formData.constituency}
                onChange={handleInputChange('constituency')}
                placeholder="विधानसभा मतदार संघ"
              />
            </div>
          </div>
        </div>

        {/* Contact Numbers */}
        <div className="form-group-card">
          <div className="card-label">संपर्क क्रमांक</div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">6. मोबाईल क्रमांक <span className="required">*</span></label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-phone"></i> +91</span>
                <input
                  type="tel"
                  className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
                  value={formData.mobileNumber}
                  onChange={handleInputChange('mobileNumber')}
                  placeholder="10 अंकी मोबाईल क्रमांक"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              {errors.mobileNumber && <div className="invalid-feedback d-block">{errors.mobileNumber}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">7. पर्यायी दूरध्वनी क्रमांक</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                <input
                  type="tel"
                  className={`form-control ${errors.alternatePhone ? 'is-invalid' : ''}`}
                  value={formData.alternatePhone}
                  onChange={handleInputChange('alternatePhone')}
                  placeholder="पर्यायी क्रमांक"
                  inputMode="numeric"
                />
              </div>
              {errors.alternatePhone && <div className="invalid-feedback d-block">{errors.alternatePhone}</div>}
            </div>
          </div>
        </div>

        <div className="form-group-card">
          <div className="card-label">8. बँक खाते माहिती</div>
          <p className="field-note">या अर्जासाठी बँक तपशील अनिवार्य आहेत. सर्व संबंधित फील्ड पूर्ण भरा.</p>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">खाते असलेल्या बँकेचे नाव <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.bankName ? 'is-invalid' : ''}`}
                value={formData.bankName}
                onChange={handleInputChange('bankName')}
                placeholder="बँकेचे नाव"
              />
              {errors.bankName && <div className="invalid-feedback">{errors.bankName}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">शाखा <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.branchName ? 'is-invalid' : ''}`}
                value={formData.branchName}
                onChange={handleInputChange('branchName')}
                placeholder="शाखेचे नाव"
              />
              {errors.branchName && <div className="invalid-feedback">{errors.branchName}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">बँक खाते क्रमांक <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.accountNumber ? 'is-invalid' : ''}`}
                value={formData.accountNumber}
                onChange={handleInputChange('accountNumber')}
                placeholder="खाते क्रमांक"
                inputMode="numeric"
              />
              {errors.accountNumber && <div className="invalid-feedback">{errors.accountNumber}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">IFSC क्रमांक <span className="required">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.ifscCode ? 'is-invalid' : ''}`}
                value={formData.ifscCode}
                onChange={handleInputChange('ifscCode')}
                placeholder="IFSC क्रमांक"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.ifscCode && <div className="invalid-feedback">{errors.ifscCode}</div>}
            </div>
          </div>
        </div>

        <div className="form-group-card">
          <div className="card-label">13. दारिद्र्य रेषेखालील असल्यास</div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">यादीतील क्रमांक</label>
              <input
                type="text"
                className="form-control"
                value={formData.bplNumber}
                onChange={handleInputChange('bplNumber')}
                placeholder="यादीतील क्रमांक"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">वर्ष</label>
              <input
                type="text"
                className="form-control"
                value={formData.bplYear}
                onChange={handleInputChange('bplYear')}
                placeholder="वर्ष"
                inputMode="numeric"
              />
              {errors.bplYear && <div className="invalid-feedback d-block">{errors.bplYear}</div>}
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

