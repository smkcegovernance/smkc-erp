'use client'

import { useEffect, useRef } from 'react'

interface SuccessModalProps {
  show: boolean
  registrationNumber: string
  onClose: () => void
}

export default function SuccessModal({ show, registrationNumber, onClose }: SuccessModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (show && modalRef.current) {
      const bootstrap = require('bootstrap')
      const modal = new bootstrap.Modal(modalRef.current)
      modal.show()

      modalRef.current.addEventListener('hidden.bs.modal', onClose)

      return () => {
        modal.hide()
      }
    }
  }, [show, onClose])

  return (
    <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body text-center py-5">
            <div className="success-icon mb-4">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h4 className="mb-3">नोंदणी यशस्वी!</h4>
            <p className="text-muted mb-4">
              तुमचा दिव्यांग व्यक्ती नोंदणी फॉर्म यशस्वीरित्या सबमिट झाला आहे.
            </p>
            <p className="mb-4">
              <strong>नोंदणी क्रमांक:</strong>{' '}
              <span className="text-primary">{registrationNumber}</span>
            </p>
            <button
              type="button"
              className="btn btn-primary"
              data-bs-dismiss="modal"
              onClick={onClose}
            >
              नवीन नोंदणी
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
