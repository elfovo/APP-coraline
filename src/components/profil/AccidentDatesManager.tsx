'use client';

import { useState } from 'react';
import { formatLongDate } from '@/lib/dateUtils';

const CalendarDateIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface AccidentDatesManagerProps {
  dates: string[];
  onDatesChange: (dates: string[]) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export default function AccidentDatesManager({
  dates,
  onDatesChange,
  onToast,
}: AccidentDatesManagerProps) {
  const [newDate, setNewDate] = useState('');


  const handleAddDate = () => {
    if (!newDate.trim()) return;
    
    if (dates.includes(newDate)) {
      onToast('Cette date est déjà ajoutée.', 'error');
      return;
    }
    
    onDatesChange([...dates, newDate]);
    setNewDate('');
    onToast('Date d\'accident ajoutée avec succès.', 'success');
  };

  const handleRemoveDate = (index: number) => {
    const newDates = dates.filter((_, i) => i !== index);
    onDatesChange(newDates);
    onToast('Date d\'accident supprimée avec succès.', 'success');
  };

  const handleUpdateDate = (index: number, newValue: string) => {
    const newDates = [...dates];
    newDates[index] = newValue;
    onDatesChange(newDates);
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <label className="text-white/80 text-sm font-medium flex items-center gap-2">
        <CalendarDateIcon className="w-5 h-5" /> Dates des accidents
      </label>
      <p className="text-white/60 text-xs">
        Ajoutez les dates de vos accidents ou traumatismes. Elles seront visibles dans le calendrier.
      </p>
      
      <div className="space-y-3">
        {dates.length > 0 && (
          <div className="space-y-2">
            {dates.map((date, index) => (
              <div
                key={index}
                className="group relative flex items-center gap-3 p-3 rounded-2xl bg-red-500/10 border border-red-400/30 backdrop-blur-sm hover:bg-red-500/15 transition-all duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-white/90 font-medium text-sm">{formatLongDate(date)}</span>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => handleUpdateDate(index, e.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50 transition-all duration-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDate(index)}
                  className="p-2 rounded-xl bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30 hover:border-red-400/70 transition-all duration-300 flex-shrink-0"
                  title="Supprimer cette date"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            placeholder="Sélectionner une date"
            className="flex-1 px-4 py-2 rounded-xl bg-black/30 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50 transition-all duration-300"
          />
          <button
            type="button"
            onClick={handleAddDate}
            disabled={!newDate.trim()}
            className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center gap-2 text-sm"
            title="Ajouter cette date"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

