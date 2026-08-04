'use client'

import { ChangeEvent } from 'react'
import { SWRFormData } from '../../types/formTypes'

interface Props {
  formData: SWRFormData
  updateFormData: (field: string, value: unknown) => void
  errors: Record<string, string>
  onNext: () => void
}

const VILLAGE_OPTIONS = ['Sangli', 'Miraj', 'Kupwad']
const WARD_OPTIONS = Array.from({ length: 20 }, (_, i) => String(i + 1))

export default function BasicInfoSection({ formData, updateFormData, errors, onNext }: Props) {
  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value
    if (field === 'mobileNumber') value = value.replace(/\D/g, '').slice(0, 10)
    if (field === 'aadhaarNumber') value = value.replace(/\D/g, '').slice(0, 12)
    updateFormData(field, value)
  }

  return (
    <section className="form-section active" id="swrSection1">
      <div className="section-header">
        <div className="section-heading-block">
          <span className="section-eyebrow">Step 01</span>
          <h4><i className="bi bi-person-fill"></i> मूलभूत माहिती</h4>
          <p className="section-description">नाव, जन्मतारीख, मोबाईल आणि आधार तपशील अचूकपणे नोंदवा.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="row g-3">

          {/* Full Name */}
          <div className="col-12">
            <label className="form-label fw-semibold">पूर्ण नाव <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
              placeholder="नाव अचूकपणे लिहा"
              value={formData.fullName}
              onChange={handleChange('fullName')}
            />
            {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
          </div>

          {/* DOB */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">जन्मतारीख <span className="text-danger">*</span></label>
            <input
              type="date"
              className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
              value={formData.dob}
              onChange={handleChange('dob')}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
          </div>

          {/* Mobile */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">मोबाईल नंबर <span className="text-danger">*</span></label>
            <input
              type="tel"
              className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
              placeholder="10 अंकी मोबाईल नंबर"
              value={formData.mobileNumber}
              onChange={handleChange('mobileNumber')}
              inputMode="numeric"
            />
            {errors.mobileNumber && <div className="invalid-feedback">{errors.mobileNumber}</div>}
          </div>

          {/* Aadhaar */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">आधार क्रमांक <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${errors.aadhaarNumber ? 'is-invalid' : ''}`}
              placeholder="12 अंकी आधार क्रमांक"
              value={formData.aadhaarNumber}
              onChange={handleChange('aadhaarNumber')}
              inputMode="numeric"
            />
            {errors.aadhaarNumber && <div className="invalid-feedback">{errors.aadhaarNumber}</div>}
          </div>

          {/* District — fixed to Sangli */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">जिल्हा</label>
            <input
              type="text"
              className="form-control bg-light"
              value="Sangli"
              readOnly
            />
          </div>

          {/* Village / City — dropdown */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">शहर <span className="text-danger">*</span></label>
            <select
              className={`form-select ${errors.village ? 'is-invalid' : ''}`}
              value={formData.village}
              onChange={handleChange('village')}
            >
              <option value="">शहर निवडा</option>
              {VILLAGE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {errors.village && <div className="invalid-feedback">{errors.village}</div>}
          </div>

          {/* Ward — dropdown 1-20 */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">वॉर्ड <span className="text-danger">*</span></label>
            <select
              className={`form-select ${errors.ward ? 'is-invalid' : ''}`}
              value={formData.ward}
              onChange={handleChange('ward')}
            >
              <option value="">वॉर्ड निवडा (1–20)</option>
              {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            {errors.ward && <div className="invalid-feedback">{errors.ward}</div>}
          </div>

        </div>
      </div>

      <div className="section-footer d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
        >
          पुढे चला <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </section>
  )
}
