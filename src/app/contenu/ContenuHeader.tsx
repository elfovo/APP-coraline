export default function ContenuHeader() {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
          Fiches pratiques
        </p>
        <h1 className="text-4xl font-bold text-white mt-1">
          Ressources pour ton rétablissement
        </h1>
        <p className="text-white/70 mt-3 max-w-3xl">
          Tout ce qu&apos;il faut pour guider ton quotidien post-commotion et
          impliquer ton entourage : routines, audios, checklists, ainsi
          qu&apos;un espace dédié aux accompagnants.
        </p>
      </div>
    </header>
  );
}




