interface ProgressIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
}

const steps = [
  { id: 1, icon: 'bi-person', label: 'वैयक्तिक माहिती' },
  { id: 2, icon: 'bi-geo-alt', label: 'पत्ता व संपर्क' },
  { id: 3, icon: 'bi-clipboard2-pulse', label: 'दिव्यांगत्व माहिती' },
  { id: 4, icon: 'bi-file-earmark-check', label: 'दस्तऐवज' },
]

export default function ProgressIndicator({ currentStep, onStepClick }: ProgressIndicatorProps) {
  return (
    <div className="progress-section">
      <div className="container">
        <div className="progress-wrapper">
          {steps.map((step, index) => (
            <div key={step.id}>
              <div
                className={`progress-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                onClick={() => onStepClick(step.id)}
                style={{ cursor: currentStep > step.id ? 'pointer' : 'default' }}
              >
                <div className="step-icon">
                  {currentStep > step.id ? (
                    <i className="bi bi-check-lg"></i>
                  ) : (
                    <i className={`bi ${step.icon}`}></i>
                  )}
                </div>
                <span>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-line ${currentStep > step.id ? 'active' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
