'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { findUserByPatientId } from '@/lib/patientAccess';
import { SimpleButton } from '@/components/buttons';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';

type PatientData = {
  userId: string;
  displayName: string | null;
  patientId?: string;
};

function formatCommentDate(iso: string, language: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function EntourageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const patientIdFromUrl = searchParams.get('patientId') ?? '';

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateISO, setDateISO] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingComments, setExistingComments] = useState<{ dateISO: string; comment: string }[]>([]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.sessionStorage.getItem('patientData') : null;
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.userId) {
          setPatientData({
            userId: data.userId,
            displayName: data.displayName ?? null,
            patientId: data.patientId ?? (patientIdFromUrl || undefined),
          });
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }
    if (patientIdFromUrl.trim()) {
      findUserByPatientId(patientIdFromUrl.trim())
        .then((result) => {
          if (result) {
            const data: PatientData = {
              userId: result.userId,
              displayName: result.displayName ?? null,
              patientId: patientIdFromUrl,
            };
            setPatientData(data);
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem(
                'patientData',
                JSON.stringify({
                  userId: result.userId,
                  displayName: result.displayName ?? null,
                  patientId: patientIdFromUrl,
                  timestamp: Date.now(),
                }),
              );
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [patientIdFromUrl]);

  useEffect(() => {
    if (!loading && !patientData && !patientIdFromUrl) {
      router.replace('/');
    }
  }, [loading, patientData, patientIdFromUrl, router]);

  // Charger les commentaires déjà déposés pour ce patient
  useEffect(() => {
    if (!patientData?.userId) return;
    fetch(`/api/patient/entourage-comments?userId=${encodeURIComponent(patientData.userId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('API'))))
      .then((data: { comments?: { dateISO: string; comment: string }[] }) => {
        const list = (data?.comments ?? []).filter(
          (c) => typeof c?.dateISO === 'string' && typeof c?.comment === 'string' && c.comment.trim(),
        );
        setExistingComments(list);
      })
      .catch(() => setExistingComments([]));
  }, [patientData?.userId]);

  // Pré-remplir le champ commentaire quand on sélectionne une date qui en a déjà un
  useEffect(() => {
    if (!dateISO) return;
    const found = existingComments.find((c) => c.dateISO === dateISO);
    setComment(found?.comment ?? '');
  }, [dateISO, existingComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = patientData?.patientId ?? patientIdFromUrl;
    if (!pid) return;
    if (!dateISO.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/entourage/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: pid,
          dateISO: dateISO.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? t('entourageCommentError') });
        setSubmitting(false);
        return;
      }

      setMessage({ type: 'success', text: t('entourageCommentSuccess') });
      setComment('');
      setSubmitting(false);
      // Recharger la liste des commentaires existants
      if (patientData?.userId) {
        fetch(`/api/patient/entourage-comments?userId=${encodeURIComponent(patientData.userId)}`)
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error('API'))))
          .then((data: { comments?: { dateISO: string; comment: string }[] }) => {
            const list = (data?.comments ?? []).filter(
              (c) => typeof c?.dateISO === 'string' && typeof c?.comment === 'string' && c.comment.trim(),
            );
            setExistingComments(list);
          })
          .catch(() => {});
      }
    } catch {
      setMessage({ type: 'error', text: t('entourageCommentError') });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!patientData && !patientIdFromUrl) {
    return null;
  }

  const pid = patientData?.patientId ?? patientIdFromUrl;

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-24">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8 max-w-xl">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            {t('entourage')}
          </p>
          <h1 className="text-3xl font-bold text-white">
            {t('entourageCommentTitle')}
          </h1>
          <p className="text-white/70">
            {t('entourageCommentDescription')}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm text-white/60 hover:text-white underline"
          >
            ← {t('entourageBackToLanding')}
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-white/80 mb-3">
              {t('entourageDateLabel')}
            </p>
            <MonthlyCalendar
              selectedDate={dateISO}
              onSelect={setDateISO}
              entriesMap={{}}
              accidentDates={[]}
              commentDates={existingComments.map((c) => c.dateISO)}
            />
          </div>

          <div>
            <label htmlFor="entourage-comment" className="block text-sm font-medium text-white/80 mb-2">
              {t('entourageCommentLabel')}
            </label>
            <textarea
              id="entourage-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('entourageCommentPlaceholder')}
              rows={5}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 resize-y min-h-[120px]"
            />
          </div>

          {message && (
            <p
              className={
                message.type === 'success'
                  ? 'text-emerald-400 text-sm'
                  : 'text-red-400 text-sm'
              }
            >
              {message.text}
            </p>
          )}

          <SimpleButton
            type="submit"
            disabled={submitting || !dateISO.trim()}
          >
            {submitting ? t('updating') : t('entourageSubmitButton')}
          </SimpleButton>
        </form>

        <section className="border-t border-white/10 pt-8">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-2">
            {t('entourageExistingCommentsTitle')}
          </p>
          {existingComments.length === 0 ? (
            <p className="text-white/50 text-sm">{t('entourageExistingCommentsEmpty')}</p>
          ) : (
            <ul className="space-y-3">
              {[...existingComments]
                .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
                .map((item) => (
                  <li
                    key={item.dateISO}
                    className="bg-black/30 border border-white/10 rounded-xl p-4"
                  >
                    <p className="text-xs text-white/50 mb-1">
                      {t('entourageExistingCommentsDate')} : {formatCommentDate(item.dateISO, language)}
                    </p>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{item.comment}</p>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
