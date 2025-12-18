import { GUIDANCE_ITEMS } from './constants';

export default function GuidanceSection() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Guidance quotidienne</p>
        <h2 className="text-2xl font-semibold text-white">Plan doux pour aujourd&apos;hui</h2>
        <p className="text-white/70 text-sm">
          Trois suggestions pour garder le rythme sans t&apos;épuiser.
        </p>
      </div>
      <ul className="space-y-3">
        {GUIDANCE_ITEMS.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/30 p-3 text-white/80 text-sm"
          >
            <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}



