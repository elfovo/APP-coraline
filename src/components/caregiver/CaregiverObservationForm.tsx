'use client';

import React, { useMemo, useState } from 'react';
import OutlineInput from '@/components/inputs/OutlineInput';
import { SimpleButton } from '@/components/buttons';
import { saveCaregiverObservation } from '@/lib/firestoreEntries';

const OBSERVATION_FIELDS = [
  { id: 'concentration', label: 'Problèmes de concentration' },
  { id: 'memoire', label: 'Troubles de la mémoire' },
  { id: 'fatigue', label: 'Fatigue ou manque d’énergie' },
  { id: 'confusion', label: 'Confusion' },
  { id: 'hypersensibilite', label: 'Hypersensibilité' },
  { id: 'lumiere', label: 'Sensibilité à la lumière' },
  { id: 'bruit', label: 'Sensibilité au bruit' },
  { id: 'irritabilite', label: 'Irritabilité' },
  { id: 'tristesse', label: 'Tristesse' },
  { id: 'ralenti', label: 'Sensation d’être ralenti' },
  { id: 'anxiete', label: 'Nervosité ou anxiété' },
] as const;

export default function CaregiverObservationForm() {
  const [code, setCode] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(OBSERVATION_FIELDS.map((field) => [field.id, 0])),
  );
  const [notes, setNotes] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFields = useMemo(
    () => OBSERVATION_FIELDS.filter((field) => ratings[field.id] > 0),
    [ratings],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      await saveCaregiverObservation(code.trim(), {
        ratings,
        energyLevel,
        notes: notes.trim() || undefined,
      });
      setSuccess('Observation envoyée ! Merci pour ton aide.');
      setCode('');
      setRatings(Object.fromEntries(OBSERVATION_FIELDS.map((field) => [field.id, 0])));
      setNotes('');
      setEnergyLevel(3);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’envoyer lobservation. Vérifie le code fourni.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-6"
    >
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Étape 2 · Accompagnant
        </p>
        <h2 className="text-2xl font-semibold text-white">Observation du jour</h2>
        <p className="text-white/70">
          Entre le code partagé par le patient, puis note ce que tu observes aujourd’hui.
          Chaque curseur va de 0 (aucun signe) à 6 (intense).
        </p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 rounded-2xl p-3 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-3 text-sm">
          {error}
        </div>
      )}

      <OutlineInput
        placeholder="Code partagé (ex : X5R9V2)"
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        variant="white"
        size="lg"
        className="w-full uppercase tracking-[0.4em]"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OBSERVATION_FIELDS.map((field) => (
          <div
            key={field.id}
            className="bg-black/30 border border-white/5 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">{field.label}</p>
              <span className="text-white/60 text-sm">{ratings[field.id]}/6</span>
            </div>
            <input
              type="range"
              min={0}
              max={6}
              value={ratings[field.id]}
              onChange={(event) =>
                setRatings((prev) => ({
                  ...prev,
                  [field.id]: Number(event.target.value),
                }))
              }
              className="w-full mt-3 accent-white"
            />
          </div>
        ))}
      </div>

      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white font-medium">Niveau d’énergie global observé</p>
          <span className="text-white/70 text-sm">{energyLevel}/6</span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          value={energyLevel}
          onChange={(event) => setEnergyLevel(Number(event.target.value))}
          className="w-full accent-emerald-400"
        />
      </div>

      <div>
        <label className="text-white font-medium block mb-2">
          Notes ou exemples concrets
        </label>
        <textarea
          className="w-full min-h-[120px] rounded-2xl bg-black/40 border border-white/10 text-white p-4 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Ex : difficulté à suivre une conversation plus de 5 minutes."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {activeFields.length > 0 && (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 text-white/70 text-sm">
          <p className="font-semibold text-white mb-2">Signaux relevés aujourd’hui :</p>
          <ul className="list-disc list-inside space-y-1">
            {activeFields.map((field) => (
              <li key={field.id}>
                {field.label} · niveau {ratings[field.id]}/6
              </li>
            ))}
          </ul>
        </div>
      )}

      <SimpleButton type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Envoi en cours...' : 'Envoyer l’observation'}
      </SimpleButton>
    </form>
  );
}
