import React from 'react';
import './Switch.css';

const Switch = ({ checked, onCheckedChange, disabled, className, ...props }) => {
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <label className={`switch-wrapper ${className || ''} ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="switch-input"
        {...props}
      />
      <span className="switch-slider" />
    </label>
  );
};

export default Switch;