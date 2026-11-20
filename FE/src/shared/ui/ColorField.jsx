import { Pipette, RotateCcw } from 'lucide-react'
import { Field } from './Controls'

export function ColorField({ label, value, custom, resetLabel, onChange }) {
  return (
    <Field label={label}>
      {(props) => (
        <div className="color-control">
          <span className="color-picker">
            <i style={{ backgroundColor: value }} aria-hidden="true" />
            <span aria-hidden="true">{value.toUpperCase()}</span>
            <Pipette size={15} aria-hidden="true" />
            <input
              {...props}
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </span>
          {custom && (
            <button
              className="color-reset"
              type="button"
              aria-label={label + ' · ' + resetLabel}
              onClick={() => onChange(undefined)}
            >
              <RotateCcw size={13} aria-hidden="true" />
              {resetLabel}
            </button>
          )}
        </div>
      )}
    </Field>
  )
}
