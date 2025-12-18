type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | undefined | null>
  | ClassValue[];

function toClassNames(value: ClassValue): string[] {
  if (!value) return [];
  if (typeof value === 'string' || typeof value === 'number') return [`${value}`];
  if (Array.isArray(value)) return value.flatMap(toClassNames);
  return Object.entries(value)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);
}

// Petit helper "cn" (remplace clsx + tailwind-merge) pour éviter des deps manquantes en build.
export function cn(...inputs: ClassValue[]) {
  return inputs.flatMap(toClassNames).join(' ');
}
