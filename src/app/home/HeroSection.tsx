import { SimpleButton, OutlineButton } from '@/components/buttons';

interface HeroSectionProps {
  greeting: string;
  heroMessage: string;
  onJournalClick: () => void;
  onLibraryClick: () => void;
}

export default function HeroSection({
  greeting,
  heroMessage,
  onJournalClick,
  onLibraryClick,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 max-w-2xl">
          <p className="text-white/70 uppercase tracking-[0.3em] text-xs">Tableau de bord</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
            {greeting}, continuons ton rétablissement avec clarté.
          </h1>
          <p className="text-white/80 text-lg">{heroMessage}</p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-64">
          <SimpleButton size="lg" className="flex-1" onClick={onJournalClick}>
            Ouvrir le journal
          </SimpleButton>
          <OutlineButton
            size="lg"
            className="flex-1 border-white/40 text-white"
            onClick={onLibraryClick}
          >
            Bibliothèque
          </OutlineButton>
        </div>
      </div>
    </section>
  );
}


