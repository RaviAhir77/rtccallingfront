import React from 'react';
import './Toast.css';

const Toast = ({ id, title, description, variant, onClose }) => {
  return (
    <div className={`toast toast-${variant}`}>
      <div className="toast-content">
        {title && <h4 className="toast-title">{title}</h4>}
        {description && <p className="toast-description">{description}</p>}
      </div>
      <button onClick={() => onClose(id)} className="toast-close">
        ×
      </button>
    </div>
  );
};

export default Toast;