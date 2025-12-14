import type { DailyEntry, WeeklyTotals } from '@/types/journal';

interface WeeklyReportPayload {
  weekLabel: string;
  totals: WeeklyTotals;
  entries: DailyEntry[];
  userEmail?: string;
}

const formatDate = (dateISO: string) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return formatter.format(new Date(dateISO));
};

export async function generateWeeklyReportPdf({
  weekLabel,
  totals,
  entries,
  userEmail,
}: WeeklyReportPayload) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('CommoCare - Rapport Hebdomadaire', 14, 20);

  doc.setFontSize(12);
  doc.text(`Semaine : ${weekLabel}`, 14, 30);
  if (userEmail) {
    doc.text(`Utilisateur : ${userEmail}`, 14, 36);
  }

  doc.text('Totaux par catégorie :', 14, 48);
  const totalLines = [
    `• Symptômes : ${totals.symptoms}/132`,
    `• Médicaments / Thérapies : ${totals.medications}`,
    `• Activités (minutes) : ${totals.activities}`,
    `• Éléments perturbateurs : ${totals.perturbateurs}`,
  ];
  totalLines.forEach((line, index) => {
    doc.text(line, 14, 56 + index * 6);
  });

  doc.text('Résumé quotidien :', 14, 90);
  entries.forEach((entry, idx) => {
    const y = 100 + idx * 20;
    if (y > 270) {
      doc.addPage();
    }
    doc.text(
      `${formatDate(entry.dateISO)} · statut ${entry.status}`,
      14,
      y,
    );
    doc.text(
      `Symptômes ${entry.symptoms.reduce((a, b) => a + b.intensity, 0)}/132`,
      14,
      y + 6,
    );
    doc.text(
      `Médicaments ${entry.medications.length} · Activités ${entry.activities.length}`,
      14,
      y + 12,
    );
  });

  doc.text(
    'Document généré automatiquement depuis le journal CommoCare.',
    14,
    285,
  );
  doc.save(`CommoCare-${weekLabel.replace(/\s+/g, '-')}.pdf`);
}
