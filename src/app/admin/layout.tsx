
// src/app/admin/layout.tsx
'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Home, Briefcase, Lightbulb, GanttChartSquare, LogOut, Loader2, UserCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Store the current path to redirect back after login
      const callbackUrl = pathname.startsWith('/admin') ? pathname : '/admin';
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    // This state should ideally be brief due to the useEffect redirect.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }
  
  const isActive = (href: string) => pathname === href;
  const welcomeName = session?.user?.name || session?.user?.email || 'User';

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card p-4 border-r flex flex-col">
        <div className="mb-8">
          <Link href="/admin" className="inline-block">
            <h2 className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
              Admin Panel
            </h2>
          </Link>
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <UserCircle className="h-5 w-5 mr-2" />
            <span>Welcome, {welcomeName}!</span>
          </div>
        </div>
        <nav className="space-y-1 flex-grow">
          <Link 
            href="/admin" 
            className={`flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/admin') ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Home className="mr-3 h-5 w-5" /> Dashboard
          </Link>
          <Link 
            href="/admin/projects" 
            className={`flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/admin/projects') ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <GanttChartSquare className="mr-3 h-5 w-5" /> Projects
          </Link>
          <Link 
            href="/admin/experience" 
            className={`flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/admin/experience') ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Briefcase className="mr-3 h-5 w-5" /> Experience
          </Link>
          <Link 
            href="/admin/skills" 
            className={`flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/admin/skills') ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Lightbulb className="mr-3 h-5 w-5" /> Skills
          </Link>
        </nav>
        <div className="mt-auto space-y-2">
           <Button 
             variant="outline" 
             className="w-full justify-start"
             onClick={() => signOut({ callbackUrl: '/login' })}
           >
             <LogOut className="mr-3 h-5 w-5" /> Logout
           </Button>
           <Button variant="ghost" className="w-full justify-start text-sm" asChild>
             <Link href="/" className="flex items-center p-2 rounded-md text-sm hover:bg-secondary hover:text-secondary-foreground transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              Back to Site
            </Link>
           </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 lg:p-10 bg-background overflow-auto">
        {children}
      </main>
    </div>
  );
}
