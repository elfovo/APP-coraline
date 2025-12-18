import { QUICK_TIPS } from './constants';
import QuickTipCard from './QuickTipCard';

export default function QuickTipsSection() {
  return (
    <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1 space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Rappels rapides
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Micro-fiches à consulter au quotidien
          </h2>
          <p className="text-white/70">
            Ces trois fiches peuvent être partagées directement avec ton
            thérapeute ou ton entourage pour garder le fil entre les
            consultations.
          </p>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_TIPS.map((tip) => (
            <QuickTipCard key={tip.title} tip={tip} />
          ))}
        </div>
      </div>
    </section>
  );
}


