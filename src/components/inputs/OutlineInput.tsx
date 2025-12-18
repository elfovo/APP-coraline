import React from 'react';

interface OutlineInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'white' | 'gray' | 'blue';
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  name?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function OutlineInput({
  placeholder = '',
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'white',
  type = 'text',
  name,
  id,
  required = false,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  min,
  max,
  step,
  ariaLabel,
  ariaDescribedBy,
  error,
  success = false,
  leftIcon,
  rightIcon
}: OutlineInputProps) {
  const baseClasses = 'rounded-full font-medium shadow-lg transition-all duration-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const sizeClasses = {
    sm: 'px-2 py-2 text-xs sm:px-3 sm:py-2 sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base md:px-6',
    lg: 'px-4 py-3 text-sm sm:px-6 sm:py-3 sm:text-base md:px-8 md:text-lg'
  };
  
  const variantClasses = {
    white: `border-2 border-white text-white placeholder-white placeholder-opacity-70 focus:ring-white ${error ? 'border-red-500 focus:ring-red-500' : ''}`,
    gray: `border-2 border-gray-300 text-gray-700 placeholder-gray-500 focus:ring-gray-500 ${error ? 'border-red-500 focus:ring-red-500' : ''}`,
    blue: `border-2 border-blue-500 text-blue-500 placeholder-blue-400 focus:ring-blue-500 ${error ? 'border-red-500 focus:ring-red-500' : ''}`
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : '';

  const paddingClasses = leftIcon || rightIcon ? {
    sm: 'px-2 py-2 text-xs sm:px-3 sm:py-2 sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base md:px-6',
    lg: 'px-4 py-3 text-sm sm:px-6 sm:py-3 sm:text-base md:px-8 md:text-lg'
  } : sizeClasses;

  const combinedClasses = `
    ${baseClasses}
    ${paddingClasses[size]}
    ${variantClasses[variant]}
    ${disabledClasses}
    ${className}
  `.trim();

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        type={type}
        id={id}
        name={name}
        className={combinedClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : 'false'}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          {rightIcon}
        </div>
      )}
      {error && (
        <div className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
