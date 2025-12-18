'use client';

import { motion } from 'motion/react';
import { useRef } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  className?: string;
  max?: string;
}

export default function DateInput({
  value,
  onChange,
  delay = 0,
  className = '',
  max
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      onClick={handleContainerClick}
      className={`
        w-full flex-1 min-h-[100px] p-6 
        bg-gradient-to-br from-white/10 via-white/5 to-white/0
        backdrop-blur-xl
        border border-white/20 
        rounded-3xl
        hover:border-white/40
        hover:bg-gradient-to-br hover:from-white/15 hover:via-white/10 hover:to-white/5
        transition-all duration-300 
        shadow-lg hover:shadow-2xl
        relative overflow-hidden
        flex flex-col
        group
        cursor-text
        ${className}
      `}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Contenu */}
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6 text-white/90 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
            Date de l'accident
          </h3>
        </div>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={max}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent border-0 text-white/70 placeholder-white/40 focus:outline-none transition-all duration-300 text-sm leading-relaxed group-hover:text-white/80 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity"
        />
      </div>

      {/* Indicateur de flèche */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg 
          className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}

