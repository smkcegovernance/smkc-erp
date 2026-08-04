'use client'

import { SWRFormData, SCHEMES_CONFIG } from '../../types/formTypes'

interface Props {
  formData: SWRFormData
  updateFormData: (field: string, value: unknown) => void
  errors: Record<string, string>
  onSubmit: () => void
  onPrev: () => void
  isSubmitting: boolean
}

export default function SchemesSection({ formData, updateFormData, errors, onSubmit, onPrev, isSubmitting }: Props) {
  const dataAsRecord = formData as unknown as Record<string, unknown>

  return (
    <section className="form-section active" id="swrSection3">
      <div className="section-header">
        <div className="section-heading-block">
          <span className="section-eyebrow">Step 03</span>
          <h4><i className="bi bi-card-checklist"></i> शासकीय योजनेची माहिती</h4>
          <p className="section-description">खालील योजनांमध्ये अर्जदाराने लाभ घेतला आहे का ते नोंदवा.</p>
        </div>
      </div>
      <div className="section-body">
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '3rem' }}>अ.क्र.</th>
                <th>योजना / कार्यक्रम</th>
                <th style={{ width: '10rem' }} className="text-center">लाभ घेतला</th>
              </tr>
            </thead>
            <tbody>
              {SCHEMES_CONFIG.map((entry, idx) => {
                const code = entry[0]
                const name = entry[1]
                return (
                  <tr key={code}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>{name}</td>
                    <td className="text-center">
                      <div className="form-check form-check-inline mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`scheme_${code}`}
                          id={`s${code}_y`}
                          value="Y"
                          checked={dataAsRecord[code] === 'Y'}
                          onChange={() => updateFormData(code, 'Y')}
                        />
                        <label className="form-check-label text-success fw-semibold" htmlFor={`s${code}_y`}>होय</label>
                      </div>
                      <div className="form-check form-check-inline mb-0">
                        <input
                          className="form-check-input"
                          type="radio"
                          name={`scheme_${code}`}
                          id={`s${code}_n`}
                          value="N"
                          checked={dataAsRecord[code] === 'N'}
                          onChange={() => updateFormData(code, 'N')}
                        />
                        <label className="form-check-label text-danger" htmlFor={`s${code}_n`}>नाही</label>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Terms */}
        <div className="mt-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="swrTerms"
              checked={formData.termsAccepted}
              onChange={e => updateFormData('termsAccepted', e.target.checked)}
            />
            <label className="form-check-label" htmlFor="swrTerms">
              माझी वरील माहिती खरी आहे आणि मी अटी व शर्तींना संमत आहे.
            </label>
          </div>
          {errors.termsAccepted && <div className="text-danger small">{errors.termsAccepted}</div>}
        </div>
      </div>

      <div className="section-footer d-flex justify-content-between mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={onPrev}>
          <i className="bi bi-arrow-left"></i> मागे
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={onSubmit}
          disabled={isSubmitting || !formData.termsAccepted}
        >
          {isSubmitting ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>नोंदणी होत आहे...</>
          ) : (
            <><i className="bi bi-check2-circle"></i> नोंदणी पूर्ण करा</>
          )}
        </button>
      </div>
    </section>
  )
}
