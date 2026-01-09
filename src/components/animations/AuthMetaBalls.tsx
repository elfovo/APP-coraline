'use client';

import { usePathname } from 'next/navigation';
import MetaBalls from './MetaBalls';

const AUTH_PATHS = ['/login', '/register', '/reset-password'];

export default function AuthMetaBalls() {
  const pathname = usePathname();
  if (!pathname) {
    return null;
  }

  const shouldShow = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <MetaBalls className="absolute inset-0" enableMouseInteraction={false} />
    </div>
  );
}






