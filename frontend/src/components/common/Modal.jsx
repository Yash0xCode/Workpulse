import { useEffect, useRef } from 'react'
import { Icon } from './Icons.jsx'

/**
 * Generic modal dialog.
 * Props:
 *   open      – boolean, controls visibility
 *   onClose   – callback when backdrop or × is clicked
 *   title     – string, shown in modal header
 *   size      – 'sm' | 'md' | 'lg' (default 'md')
 *   children  – modal body
 *   footer    – optional footer node (e.g. action buttons)
 */
function Modal({ open = false, onClose, title, size = 'md', children, footer }) {
  const dialogRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trap scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        className={`modal-dialog modal-dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
      >
        <div className="modal-header">
          {title && <h3 id="modal-title" className="modal-title">{title}</h3>}
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
