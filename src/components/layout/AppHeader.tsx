
"use client";
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header'; // The original Header

export function AppHeader() {
  const pathname = usePathname();
  // Do not render the main public Header for admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }
  return <Header />;
}
