import React from 'react';
import './Label.css';

const Label = ({ htmlFor, children, className, ...props }) => {
  return (
    <label htmlFor={htmlFor} className={`label ${className || ''}`} {...props}>
      {children}
    </label>
  );
};

export default Label;