interface ShortcutsSectionProps {
  onStatisticsClick: () => void;
  onProfileClick: () => void;
}

export default function ShortcutsSection({
  onStatisticsClick,
  onProfileClick,
}: ShortcutsSectionProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Raccourcis rapides</p>
        <h2 className="text-2xl font-semibold text-white">Où veux-tu aller ?</h2>
        <p className="text-white/70 text-sm">
          Choisis un espace selon ton besoin du moment.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onStatisticsClick}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-4 text-left text-white hover:border-white/40 transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">Tendances</p>
          <p className="text-lg font-semibold">Calendrier & statistiques</p>
          <p className="text-sm text-white/70 mt-1">Visualise toutes tes journées passées.</p>
        </button>
        <button
          type="button"
          onClick={onProfileClick}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-pink-500/10 p-4 text-left text-white hover:border-white/40 transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">Réglages</p>
          <p className="text-lg font-semibold">Profil & préférences</p>
          <p className="text-sm text-white/70 mt-1">Met à jour tes rappels et ton équipe.</p>
        </button>
      </div>
    </div>
  );
}


