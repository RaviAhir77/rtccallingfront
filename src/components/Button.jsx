import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'default', size = 'md', className = '', ...props }) => {
  const buttonClass = `btn btn-${variant} btn-${size} ${className}`;
  
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;