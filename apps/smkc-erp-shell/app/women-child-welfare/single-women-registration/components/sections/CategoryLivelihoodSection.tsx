'use client'

import { ChangeEvent } from 'react'
import { SWRFormData, OCCUPATION_OPTIONS } from '../../types/formTypes'

interface Props {
  formData: SWRFormData
  updateFormData: (field: string, value: unknown) => void
  errors: Record<string, string>
  onNext: () => void
  onPrev: () => void
}

export default function CategoryLivelihoodSection({ formData, updateFormData, errors, onNext, onPrev }: Props) {
  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    updateFormData(field, e.target.value)
  }

  const AGE_GROUPS = ['18-29', '30-44', '45-54', '55-64+']
  const CATEGORIES = [
    { value: 'RURAL',      label: 'ग्रामीण' },
    { value: 'URBAN',      label: 'नागरी' },
    { value: 'DOMESTIC',   label: 'घरगुती' },
    { value: 'ADDITIONAL', label: 'अतिरिक्त' },
  ]

  return (
    <section className="form-section active" id="swrSection2">
      <div className="section-header">
        <div className="section-heading-block">
          <span className="section-eyebrow">Step 02</span>
          <h4><i className="bi bi-tags-fill"></i> वर्ग, वयोगट आणि उपजीविका</h4>
          <p className="section-description">महिला वर्ग, वयोगट आणि उपजीविका संबंधीत माहिती भरा.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="row g-4">

          {/* Women Category */}
          <div className="col-12">
            <label className="form-label fw-bold">महिला वर्ग निवड <span className="text-danger">*</span></label>
            <div className="d-flex flex-wrap gap-3">
              {CATEGORIES.map(c => (
                <div key={c.value} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="womenCategory"
                    id={`cat_${c.value}`}
                    value={c.value}
                    checked={formData.womenCategory === c.value}
                    onChange={handleChange('womenCategory')}
                  />
                  <label className="form-check-label" htmlFor={`cat_${c.value}`}>{c.label}</label>
                </div>
              ))}
            </div>
            {errors.womenCategory && <div className="text-danger small mt-1">{errors.womenCategory}</div>}
          </div>

          {/* Age Group */}
          <div className="col-12">
            <label className="form-label fw-bold">वयोगट <span className="text-danger">*</span></label>
            <div className="d-flex flex-wrap gap-3">
              {AGE_GROUPS.map(g => (
                <div key={g} className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="ageGroup"
                    id={`age_${g}`}
                    value={g}
                    checked={formData.ageGroup === g}
                    onChange={handleChange('ageGroup')}
                  />
                  <label className="form-check-label" htmlFor={`age_${g}`}>{g} वर्षे</label>
                </div>
              ))}
            </div>
            {errors.ageGroup && <div className="text-danger small mt-1">{errors.ageGroup}</div>}
          </div>

          {/* Occupation */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">व्यवसाय <span className="text-danger">*</span></label>
            <select className={`form-select ${errors.occupation ? 'is-invalid' : ''}`} value={formData.occupation} onChange={handleChange('occupation')}>
              <option value="">व्यवसाय निवडा</option>
              {OCCUPATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.occupation && <div className="invalid-feedback">{errors.occupation}</div>}
          </div>

          {/* Annual Income */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">वार्षिक उत्पन्न (रुपये) <span className="text-danger">*</span></label>
            <input
              type="number"
              className={`form-control ${errors.annualIncome ? 'is-invalid' : ''}`}
              placeholder="वार्षिक उत्पन्न रुपयेंमध्ये"
              value={formData.annualIncome}
              onChange={handleChange('annualIncome')}
              min="0"
            />
            {errors.annualIncome && <div className="invalid-feedback">{errors.annualIncome}</div>}
          </div>

          {/* Children */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">मुले (6 वर्षाखाली) <span className="text-danger">*</span></label>
            <input
              type="number"
              className={`form-control ${errors.childrenBelow6 ? 'is-invalid' : ''}`}
              value={formData.childrenBelow6}
              onChange={handleChange('childrenBelow6')}
              min="0" max="20"
            />
            {errors.childrenBelow6 && <div className="invalid-feedback">{errors.childrenBelow6}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">मुले (6-14 वर्षे) <span className="text-danger">*</span></label>
            <input
              type="number"
              className={`form-control ${errors.children6To14 ? 'is-invalid' : ''}`}
              value={formData.children6To14}
              onChange={handleChange('children6To14')}
              min="0" max="20"
            />
            {errors.children6To14 && <div className="invalid-feedback">{errors.children6To14}</div>}
          </div>

          {/* Other Info */}
          <div className="col-12">
            <label className="form-label fw-semibold">इतर माहिती <span className="text-danger">*</span></label>
            <textarea
              className={`form-control ${errors.otherInfo ? 'is-invalid' : ''}`}
              rows={2}
              placeholder="इतर कोणतीही अनुषंगिक माहिती"
              value={formData.otherInfo}
              onChange={handleChange('otherInfo')}
            />
            {errors.otherInfo && <div className="invalid-feedback">{errors.otherInfo}</div>}
          </div>

        </div>
      </div>

      <div className="section-footer d-flex justify-content-between mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={onPrev}>
          <i className="bi bi-arrow-left"></i> मागे
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          पुढे चला <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </section>
  )
}
