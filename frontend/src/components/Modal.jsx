import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, actions }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => {
      if (e.target.className === 'modal-backdrop') onClose();
    }}>
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
            <button className="btn ghost" onClick={onClose} aria-label="Close modal" style={{ padding: '0.25rem', minHeight: 'auto' }}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          {actions && (
            <div className="modal-footer">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
