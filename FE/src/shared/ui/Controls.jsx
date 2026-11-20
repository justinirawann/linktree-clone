import { useLayoutEffect, useId, useRef } from 'react'
import { X, Cpu, RefreshCw } from 'lucide-react'
import { cn } from '../lib/cn'
export function Brand({ name = 'Core Consign' }) {
  return (
    <span className="brand">
      <span className="brand-chip">
        <Cpu size={19} aria-hidden="true" />
      </span>
      <span>{name}</span>
    </span>
  )
}
export function Button({ children, variant = 'secondary', className, type = 'button', ...props }) {
  return (
    <button type={type} className={cn('btn', variant, className)} {...props}>
      {children}
    </button>
  )
}
export function Field({ label, error, hint, children }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error || hint ? id + '-hint' : undefined,
      })}
      {(error || hint) && (
        <small id={id + '-hint'} className={error ? 'error-text' : ''}>
          {error || hint}
        </small>
      )}
    </div>
  )
}
export function Dialog({ title, onClose, children }) {
  const ref = useRef(null),
    id = useId()
  useLayoutEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={id}>{title}</h2>
        <Button className="icon-btn" onClick={onClose} aria-label="Tutup">
          <X size={19} />
        </Button>
      </div>
      {children}
    </dialog>
  )
}
export function StatusPage({ title, children, retry, brand = <Brand />, className }) {
  return (
    <main className={cn('status-page', className)}>
      <div className="status-card">
        {brand}
        <h1>{title}</h1>
        {children}
        {retry && (
          <Button onClick={retry}>
            <RefreshCw size={16} />
            Coba lagi
          </Button>
        )}
      </div>
    </main>
  )
}
