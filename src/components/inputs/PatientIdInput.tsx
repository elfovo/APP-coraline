'use client';

import { motion } from 'motion/react';
import { useRef } from 'react';

interface PatientIdInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  delay?: number;
  className?: string;
}

export default function PatientIdInput({
  value,
  onChange,
  onSubmit,
  delay = 0,
  className = ''
}: PatientIdInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      onClick={() => inputRef.current?.focus()}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2m-7 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
            ID Patient
          </h3>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onSubmit();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Entrez l'ID patient"
          className="w-full bg-transparent border-0 text-white/70 placeholder-white/40 focus:outline-none transition-all duration-300 text-sm leading-relaxed group-hover:text-white/80"
        />
      </div>

      {/* Bouton chevron invisible supprimé */}
    </motion.div>
  );
}


