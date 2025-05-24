// src/components/layout/NextAuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface NextAuthProviderProps {
  children: ReactNode;
  // We don't pass session here from a server component as SessionProvider handles fetching it
}

export default function NextAuthProvider({ children }: NextAuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
