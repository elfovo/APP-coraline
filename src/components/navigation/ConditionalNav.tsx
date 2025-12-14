'use client';

import { usePathname } from 'next/navigation';
import SimpleNav from './SimpleNav';

const AUTH_PAGES = ['/login', '/register', '/reset-password'];

export default function ConditionalNav() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  const hideNavigation = AUTH_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (hideNavigation) {
    return null;
  }

  return <SimpleNav />;
}

