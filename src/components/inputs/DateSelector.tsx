import React, { useState, useEffect } from 'react';

interface DateSelectorProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'white' | 'gray' | 'blue';
  name?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function DateSelector({
  placeholder = '',
  value = '',
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'white',
  name,
  id,
  required = false,
  autoComplete,
  ariaLabel,
  ariaDescribedBy,
  error,
  success = false,
  leftIcon,
  rightIcon
}: DateSelectorProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const baseClasses = 'rounded-full font-medium shadow-lg transition-all duration-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const sizeClasses = {
    sm: 'px-2 py-2 text-xs sm:px-3 sm:py-2 sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base md:px-6',
    lg: 'px-4 py-3 text-sm sm:px-6 sm:py-3 sm:text-base md:px-8 md:text-lg'
  };
  
  const successClasses = success && !error ? 'border-emerald-400 focus:ring-emerald-400' : '';
  const variantClasses = {
    white: `border-2 border-white text-white placeholder-white placeholder-opacity-70 focus:ring-white ${error ? 'border-red-500 focus:ring-red-500' : ''} ${successClasses}`,
    gray: `border-2 border-gray-300 text-gray-700 placeholder-gray-500 focus:ring-gray-500 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${successClasses}`,
    blue: `border-2 border-blue-500 text-blue-500 placeholder-blue-400 focus:ring-blue-500 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${successClasses}`
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

  // Générer les options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setDay(date.getDate().toString());
        setMonth((date.getMonth() + 1).toString());
        setYear(date.getFullYear().toString());
      }
    }
  }, [value]);

  // Notifier le changement
  const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      const dateString = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      if (onChange) {
        const syntheticEvent = {
          target: { value: dateString }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = e.target.value;
    setDay(newDay);
    handleDateChange(newDay, month, year);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    handleDateChange(day, newMonth, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    setYear(newYear);
    handleDateChange(day, month, newYear);
  };

  return (
    <div className="relative" aria-describedby={ariaDescribedBy}>
      {leftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
          {leftIcon}
        </div>
      )}
      <div className={`${combinedClasses} flex items-center justify-between`}>
        {/* Jour */}
        <select
          className="bg-transparent border-none outline-none cursor-pointer flex-1"
          value={day}
          onChange={handleDayChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          id={id ? `${id}-day` : undefined}
          name={name ? `${name}-day` : undefined}
          autoComplete={autoComplete}
          aria-label={ariaLabel ? `${ariaLabel} - Jour` : 'Jour'}
        >
          <option value="">{placeholder || 'Jour'}</option>
          {days.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <span className="opacity-70">/</span>

        {/* Mois */}
        <select
          className="bg-transparent border-none outline-none cursor-pointer flex-1"
          value={month}
          onChange={handleMonthChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          id={id ? `${id}-month` : undefined}
          name={name ? `${name}-month` : undefined}
          autoComplete={autoComplete}
          aria-label={ariaLabel ? `${ariaLabel} - Mois` : 'Mois'}
        >
          <option value="">Mois</option>
          {months.map((m, index) => (
            <option key={index + 1} value={index + 1}>{m}</option>
          ))}
        </select>

        <span className="opacity-70">/</span>

        {/* Année */}
        <select
          className="bg-transparent border-none outline-none cursor-pointer flex-1"
          value={year}
          onChange={handleYearChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          id={id ? `${id}-year` : undefined}
          name={name ? `${name}-year` : undefined}
          autoComplete={autoComplete}
          aria-label={ariaLabel ? `${ariaLabel} - Année` : 'Année'}
        >
          <option value="">Année</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      
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
