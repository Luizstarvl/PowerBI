import React from 'react';
import Portal from '../../Portal';
import MetaForm from './MetaForm';

export default function MetaFormModal({ meta, onClose, onSave }) {
  return (
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">{meta ? 'Editar meta' : 'Nova meta'}</h3>
          <MetaForm meta={meta} onSave={onSave} onCancel={onClose} />
        </div>
      </div>
    </Portal>
  );
}
