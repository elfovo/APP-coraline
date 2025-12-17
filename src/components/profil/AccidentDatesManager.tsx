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
  const [dateToDelete, setDateToDelete] = useState<number | null>(null);

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
    setDateToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (dateToDelete !== null) {
      handleRemoveDate(dateToDelete);
    }
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
                className="group relative p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDateIcon className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 font-medium text-sm">{formatLongDate(date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => handleUpdateDate(index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setDateToDelete(index)}
                    className="p-2 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex-shrink-0"
                    title="Supprimer cette date"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
            className="flex-1 px-4 py-2 rounded-xl bg-black/30 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
          />
          <button
            type="button"
            onClick={handleAddDate}
            disabled={!newDate.trim()}
            className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white/90 hover:bg-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center gap-2 text-sm"
            title="Ajouter cette date"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {dateToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setDateToDelete(null)} 
          />
          <div className="relative w-full max-w-md bg-gradient-to-br from-black/95 via-black/90 to-black/95 border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Confirmer la suppression
              </h3>
              <p className="text-white/70 text-sm">
                Êtes-vous sûr de vouloir supprimer la date du{' '}
                <span className="font-medium text-white">
                  {formatLongDate(dates[dateToDelete])}
                </span> ?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setDateToDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-all duration-300 font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

