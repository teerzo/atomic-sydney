type OptionsMenuProps = {
  sensitivity: number
  onSensitivityChange: (value: number) => void
  onBack: () => void
}

export function OptionsMenu({
  sensitivity,
  onSensitivityChange,
  onBack,
}: OptionsMenuProps) {
  return (
    <div className="overlay">
      <div className="options-panel">
        <h2>Options</h2>
        <label className="options-row">
          <span>
            Mouse sensitivity
            <strong>{sensitivity.toFixed(1)}</strong>
          </span>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.1}
            value={sensitivity}
            onChange={(event) => onSensitivityChange(Number(event.target.value))}
          />
        </label>
        <button className="menu-btn" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}
