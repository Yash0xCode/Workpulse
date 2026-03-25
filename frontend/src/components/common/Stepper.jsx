function Stepper({ steps = [], currentStep = 0 }) {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isComplete = index < currentStep

        return (
          <div key={step.label} className={`stepper-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
            <div className="stepper-dot">{isComplete ? '✓' : index + 1}</div>
            <div>
              <div className="stepper-label">{step.label}</div>
              <div className="stepper-caption">{step.caption}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
