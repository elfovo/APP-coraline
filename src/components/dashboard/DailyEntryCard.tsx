'use client';

import React from 'react';
import { DailyEntry } from '@/types/journal';
import { SimpleButton } from '@/components/buttons';

interface DailyEntryCardProps {
  entry: DailyEntry;
  onEdit?: () => void;
  onAddActivity?: () => void;
}

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

export default function DailyEntryCard({
  entry,
  onEdit,
  onAddActivity,
}: DailyEntryCardProps) {
  const symptomTotal = entry.symptoms.reduce(
    (acc, item) => acc + item.intensity,
    0,
  );
  const medicationTotal = entry.medications.reduce(
    (acc, item) => acc + item.intensity,
    0,
  );
  const activityTotal = entry.activities.reduce(
    (acc, item) => acc + item.duration,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Journal du {entry.dayLabel}
          </p>
          <h2 className="text-3xl font-semibold text-white mt-2">
            {entry.status === 'complete'
              ? 'Journée complétée'
              : entry.status === 'draft'
              ? 'Brouillon en attente'
              : 'Données manquantes'}
          </h2>
          <p className="text-white/70 mt-2 max-w-2xl">
            Renseigne chaque catégorie pour suivre ton rétablissement et générer
            des rapports PDF/CSV pour ton équipe médicale.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <SimpleButton size="lg" onClick={onEdit}>
            {entry.status === 'complete' ? 'Modifier' : 'Compléter'}
          </SimpleButton>
          <SimpleButton
            size="lg"
            variant="outline"
            className="bg-white text-gray-900 border-white/40"
          >
            Exporter PDF/CSV
          </SimpleButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Symptômes (1-6)">
          <div className="space-y-3">
            {entry.symptoms.length === 0 && (
              <p className="text-white/60 text-sm">
                Aucun symptôme déclaré pour cette journée.
              </p>
            )}
            {entry.symptoms.map((symptom) => (
              <div key={symptom.id}>
                <div className="flex justify-between text-white/80 text-sm mb-1">
                  <span>{symptom.label}</span>
                  <span>{symptom.intensity}/6</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${(symptom.intensity / 6) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm mt-4">
            Total du jour :{' '}
            <span className="text-white font-semibold">{symptomTotal}/132</span>
          </p>
        </SectionCard>

        <SectionCard title="Médicaments / Thérapies (1-10)">
          <div className="space-y-3">
            {entry.medications.length === 0 && (
              <p className="text-white/60 text-sm">
                Aucun médicament ou thérapie consigné.
              </p>
            )}
            {entry.medications.map((med) => (
              <div key={med.id}>
                <div className="flex justify-between text-white/80 text-sm mb-1">
                  <span>
                    {med.label}
                    {med.dosage ? ` • ${med.dosage}` : ''}
                  </span>
                  <span>{med.intensity}/10</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${(med.intensity / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm mt-4">
            Total du jour :{' '}
            <span className="text-white font-semibold">{medicationTotal}</span>
          </p>
        </SectionCard>

        <SectionCard title="Activités & impact">
          <div className="space-y-4">
            {entry.activities.length === 0 && (
              <p className="text-white/60 text-sm">
                Ajoute des activités pour mesurer leur impact.
              </p>
            )}
            {entry.activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-white font-medium">{activity.label}</p>
                  <p className="text-white/60 text-sm">
                    {activity.duration} min
                    {activity.custom ? ' • activité personnalisée' : ''}
                  </p>
                </div>
                {typeof activity.symptomImpact === 'number' && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm">
                    Impact {activity.symptomImpact}/6
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-white/70 text-sm">
            <span>Total temps actif : {activityTotal} min</span>
            <button
              type="button"
              onClick={onAddActivity}
              className="text-white hover:text-white/70 underline underline-offset-4"
            >
              Ajouter une activité
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Éléments perturbateurs">
          {entry.perturbateurs.length === 0 ? (
            <p className="text-white/60 text-sm">
              Aucun élément perturbateur signalé.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {entry.perturbateurs.map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-full border border-white/20 text-white/80 text-sm bg-white/5"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          {entry.notes && (
            <p className="text-white/70 text-sm mt-4">{entry.notes}</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

