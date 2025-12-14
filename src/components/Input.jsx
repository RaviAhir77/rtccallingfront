import React from 'react';
import './Input.css';

const Input = ({ placeholder, value, onChange, disabled, className, ...props }) => {
  const inputClass = `input ${className || ''} ${disabled ? 'input-disabled' : ''}`;
  
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={inputClass}
      {...props}
    />
  );
};

export default Input;