/**
 * EmptyState – shown when a list or section has no data.
 * Props:
 *   icon      – Icon name (from Icons.jsx) or null
 *   title     – primary empty-state message
 *   message   – optional secondary description
 *   action    – optional { label, onClick } for a CTA button
 */
import Button from './Button.jsx'
import { Icon } from './Icons.jsx'

function EmptyState({ icon = 'inbox', title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-state-icon">
          <Icon name={icon} size={36} />
        </div>
      )}
      <div className="empty-state-title">{title}</div>
      {message && <div className="empty-state-message">{message}</div>}
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
