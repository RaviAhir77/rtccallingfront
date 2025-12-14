import React from 'react';
import './Input.css';

const Input = ({ placeholder, value, onChange, disabled, className, autoFocus, ...props }) => {
  const inputClass = `input ${className || ''} ${disabled ? 'input-disabled' : ''}`;
  
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={inputClass}
      autoFocus={autoFocus}
      {...props}
    />
  );
};

export default Input;