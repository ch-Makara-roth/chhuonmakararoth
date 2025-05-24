"use client";
import { usePathname, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';

export function AppHeader() {
  const pathname = usePathname();
  // const params = useParams(); // lang is in params - uncomment if direct access to params is needed here

  // Pathname will be like /en/admin or /km/admin or /en
  // We need to check the segment after the language code
  const pathSegments = pathname?.split('/') || []; // Handle null pathname gracefully
  
  // Check if 'admin' is the segment after the language code
  // e.g. /en/admin -> pathSegments = ['', 'en', 'admin'] -> pathSegments[2] is 'admin'
  const isAdminRoute = pathSegments.length > 2 && pathSegments[2] === 'admin';

  if (isAdminRoute) {
    return null;
  }
  return <Header />;
}
