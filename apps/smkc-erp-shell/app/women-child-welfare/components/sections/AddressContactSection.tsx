'use client'

import { ChangeEvent, useState } from 'react'
import { FormData } from '../../types/formTypes'

interface AddressContactSectionProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  errors: Record<string, string>
  onNext: () => void
  onPrev: () => void
  mobileVerified: boolean
  onMobileVerified: (verified: boolean) => void
}

export default function AddressContactSection({
  formData,
  updateFormData,
  errors,
  onNext,
  onPrev,
  mobileVerified,
  onMobileVerified,
}: AddressContactSectionProps) {
  const [otpSent, setOtpSent] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

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

    if (field === 'mobileNumber') {
      setOtpSent(false)
      setOtpInput('')
      setOtpError('')
      setOtpSuccess('')
      onMobileVerified(false)
    }

    updateFormData(field, value)
  }

  const startResendCooldown = () => {
    setResendCooldown(30)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setOtpError('कृपया वैध 10 अंकी मोबाईल क्रमांक प्रविष्ट करा')
      return
    }
    setOtpLoading(true)
    setOtpError('')
    setOtpSuccess('')

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOtpError('तुमचे इंटरनेट कनेक्शन बंद आहे. कृपया इंटरनेट सुरू करून पुन्हा प्रयत्न करा.')
      setOtpLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    try {
      const res = await fetch('/api/disability/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobileNumber }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      if (data.success) {
        setOtpSent(true)
        setOtpInput('')
        setOtpSuccess('OTP यशस्वीरित्या पाठवला गेला')
        startResendCooldown()
      } else {
        setOtpError(data.message || 'OTP पाठवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.')
      }
    } catch (err) {
      clearTimeout(timer)
      if (err instanceof Error && err.name === 'AbortError') {
        setOtpError('सर्व्हर प्रतिसाद देत नाही. हे सर्व्हर नेटवर्क समस्या असू शकते. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.')
      } else {
        setOtpError('सर्व्हरशी संपर्क होत नाही. कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpInput)) {
      setOtpError('कृपया 6 अंकी OTP प्रविष्ट करा')
      return
    }
    setOtpLoading(true)
    setOtpError('')

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOtpError('तुमचे इंटरनेट कनेक्शन बंद आहे. कृपया इंटरनेट सुरू करून पुन्हा प्रयत्न करा.')
      setOtpLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    try {
      const res = await fetch('/api/disability/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobileNumber, otp: otpInput }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      if (data.success) {
        onMobileVerified(true)
        setOtpSuccess('मोबाईल क्रमांक पडताळला ✓')
        setOtpError('')
      } else {
        setOtpError(data.message || 'OTP चुकीचा आहे. कृपया पुन्हा प्रयत्न करा.')
      }
    } catch (err) {
      clearTimeout(timer)
      if (err instanceof Error && err.name === 'AbortError') {
        setOtpError('सर्व्हर प्रतिसाद देत नाही. हे सर्व्हर नेटवर्क समस्या असू शकते. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.')
      } else {
        setOtpError('सर्व्हरशी संपर्क होत नाही. कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.')
      }
    } finally {
      setOtpLoading(false)
    }
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
                  className={`form-control ${errors.mobileNumber ? 'is-invalid' : mobileVerified ? 'is-valid' : ''}`}
                  value={formData.mobileNumber}
                  onChange={handleInputChange('mobileNumber')}
                  placeholder="10 अंकी मोबाईल क्रमांक"
                  maxLength={10}
                  inputMode="numeric"
                  disabled={mobileVerified}
                />
                {mobileVerified && (
                  <span className="input-group-text text-success">
                    <i className="bi bi-check-circle-fill"></i>
                  </span>
                )}
              </div>
              {errors.mobileNumber && <div className="invalid-feedback d-block">{errors.mobileNumber}</div>}
              {!mobileVerified && errors.mobileVerified && (
                <div className="text-danger small mt-1">{errors.mobileVerified}</div>
              )}

              {/* Send OTP button */}
              {!mobileVerified && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-2 w-100"
                  onClick={handleSendOtp}
                  disabled={otpLoading || resendCooldown > 0 || formData.mobileNumber.length !== 10}
                >
                  {otpLoading && !otpSent ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  {otpSent
                    ? resendCooldown > 0
                      ? `पुन्हा पाठवा (${resendCooldown}s)`
                      : 'पुन्हा OTP पाठवा'
                    : 'OTP पाठवा'}
                </button>
              )}

              {/* OTP input row — appears after send */}
              {otpSent && !mobileVerified && (
                <div className="mt-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className={`form-control ${otpError ? 'is-invalid' : ''}`}
                      value={otpInput}
                      onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError('') }}
                      placeholder="6 अंकी OTP प्रविष्ट करा"
                      maxLength={6}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpInput.length !== 6}
                    >
                      {otpLoading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                      OTP पडताळा
                    </button>
                  </div>
                  {otpError && <div className="text-danger small mt-1">{otpError}</div>}
                  {otpSuccess && <div className="text-success small mt-1">{otpSuccess}</div>}
                </div>
              )}
              {mobileVerified && (
                <div className="text-success small mt-1">
                  <i className="bi bi-check-circle-fill me-1"></i>मोबाईल क्रमांक पडताळला
                </div>
              )}
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

