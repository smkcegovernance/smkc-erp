'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

type PopupTone = 'success' | 'error' | 'info' | 'warning' | 'confirm'
type PopupActionVariant = 'primary' | 'secondary' | 'danger'

interface ErpPopupAction {
  label: string
  onClick: () => void
  variant?: PopupActionVariant
}

interface ErpPopupProps {
  open: boolean
  tone?: PopupTone
  title: string
  description?: string
  children?: ReactNode
  actions?: ErpPopupAction[]
  onClose?: () => void
  closeOnBackdrop?: boolean
}

const toneMeta: Record<PopupTone, { icon: string; badge: string }> = {
  success: { icon: 'bi-check-circle-fill', badge: 'Success' },
  error: { icon: 'bi-x-octagon-fill', badge: 'Error' },
  info: { icon: 'bi-info-circle-fill', badge: 'Info' },
  warning: { icon: 'bi-exclamation-triangle-fill', badge: 'Warning' },
  confirm: { icon: 'bi-question-circle-fill', badge: 'Confirm' },
}

export default function ErpPopup({
  open,
  tone = 'info',
  title,
  description,
  children,
  actions,
  onClose,
  closeOnBackdrop = true,
}: ErpPopupProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  const resolvedActions = actions && actions.length > 0
    ? actions
    : onClose
      ? [{ label: 'Close', onClick: onClose, variant: 'primary' as PopupActionVariant }]
      : []

  const meta = toneMeta[tone]

  return (
    <div
      className="erp-popup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={closeOnBackdrop && onClose ? onClose : undefined}
    >
      <div className={`erp-popup erp-popup-${tone}`} onClick={(event) => event.stopPropagation()}>
        <div className="erp-popup-header">
          <div>
            <span className="erp-popup-badge">{meta.badge}</span>
            <h2 className="erp-popup-title">
              <i className={`bi ${meta.icon}`} aria-hidden="true" />
              <span>{title}</span>
            </h2>
            {description ? <p className="erp-popup-desc">{description}</p> : null}
          </div>
          {onClose ? (
            <button type="button" className="erp-popup-close" onClick={onClose} aria-label="Close popup">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {children ? <div className="erp-popup-body">{children}</div> : null}

        {resolvedActions.length > 0 ? (
          <div className="erp-popup-actions">
            {resolvedActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`erp-popup-action erp-popup-action-${action.variant ?? 'primary'}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}