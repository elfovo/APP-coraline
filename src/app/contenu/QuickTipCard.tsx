import type { QuickTip } from './constants';

interface QuickTipCardProps {
  tip: QuickTip;
}

export default function QuickTipCard({ tip }: QuickTipCardProps) {
  return (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
      <h3 className="text-white font-semibold">{tip.title}</h3>
      <p className="text-white/70 text-sm mt-2">{tip.description}</p>
    </div>
  );
}


