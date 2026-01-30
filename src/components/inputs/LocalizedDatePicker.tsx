'use client';

import { forwardRef, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { fr } from 'date-fns/locale/fr';
import { enUS } from 'date-fns/locale/en-US';
import styles from './LocalizedDatePicker.module.css';

registerLocale('fr', fr);
registerLocale('en', enUS);

type LocalizedDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  maxDate?: Date;
  popperPlacement?: 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';
};

const StyledInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }>(
  ({ value, onClick, placeholder, className }, ref) => {
    // Si la valeur est vide ou undefined, on force une chaîne vide pour afficher le placeholder
    const displayValue = value && String(value).trim() ? String(value) : '';
    return (
      <input
        readOnly
        value={displayValue}
        placeholder={placeholder}
        onClick={onClick}
        ref={ref}
        className={className}
      />
    );
  },
);
StyledInput.displayName = 'StyledInput';

export default function LocalizedDatePicker({
  value,
  onChange,
  placeholder,
  className = '',
  size = 'md',
  maxDate,
  popperPlacement = 'bottom-start',
}: LocalizedDatePickerProps) {
  const { language } = useLanguage();

  const selectedDate = useMemo(() => {
    if (!value) return null;
    return new Date(`${value}T00:00:00`);
  }, [value]);

  const handleChange = (date: Date | null) => {
    if (!date) {
      onChange('');
      return;
    }

    const iso = date.toISOString().split('T')[0];
    onChange(iso);
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm'
      : 'px-4 py-2 text-sm sm:px-4 sm:py-3 sm:text-base md:px-6 md:py-3';

  const inputClasses = [
    'w-full rounded-xl bg-black/30 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 [color-scheme:dark]',
    sizeClasses,
    className,
  ].join(' ');

  return (
    <div className="relative w-full">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        maxDate={maxDate}
        dateFormat={language === 'en' ? 'MMMM d, yyyy' : 'd MMMM yyyy'}
        locale={language === 'en' ? 'en' : 'fr'}
        calendarStartDay={language === 'en' ? 0 : 1}
        popperPlacement={popperPlacement}
        showPopperArrow={false}
        wrapperClassName="w-full"
        calendarClassName={styles.calendar}
        popperClassName={styles.popper}
        customInput={
          <StyledInput
            placeholder={placeholder ?? (language === 'en' ? 'mm/dd/yyyy' : 'jj/mm/aaaa')}
            className={inputClasses}
          />
        }
      />
    </div>
  );
}

