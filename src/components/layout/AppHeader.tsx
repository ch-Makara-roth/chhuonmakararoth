"use client";
import { usePathname, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';

export function AppHeader() {
  const pathname = usePathname();
  const params = useParams(); // lang is in params

  // Pathname will be like /en/admin or /km/admin
  // We need to check the segment after the language code
  const pathSegments = pathname.split('/'); // ['', 'en', 'admin', ...] or ['', 'en']
  
  // Check if 'admin' is the segment after the language code
  const isAdminRoute = pathSegments.length > 2 && pathSegments[2] === 'admin';

  if (isAdminRoute) {
    return null;
  }
  return <Header />;
}
