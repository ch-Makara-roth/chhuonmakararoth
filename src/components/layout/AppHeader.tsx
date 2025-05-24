
"use client";
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';

export function AppHeader() {
  const pathname = usePathname();
  
  // Check if the current path starts with /admin
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }
  return <Header />;
}
