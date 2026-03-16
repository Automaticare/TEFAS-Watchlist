import './DateRangeSelector.css'

const RANGES = [
  { key: 7, label: '7 Gün' },
  { key: 30, label: '30 Gün' },
  { key: 90, label: '90 Gün' },
]

function DateRangeSelector({ value, onChange }) {
  return (
    <div className="date-range-selector">
      {RANGES.map((range) => (
        <button
          key={range.key}
          className={`range-btn ${value === range.key ? 'range-btn-active' : ''}`}
          onClick={() => onChange(range.key)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

export default DateRangeSelector
