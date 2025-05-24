import Link from 'next/link';
import type { ReactNode } from 'react';
import { Home, Briefcase, Lightbulb, Settings, GanttChartSquare, MessageSquare } from 'lucide-react'; // Added GanttChartSquare, MessageSquare

interface AdminLayoutProps {
  children: ReactNode;
  params: { lang: string };
}

export default function AdminLayout({ children, params: { lang } }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card p-4 border-r flex flex-col">
        <div className="mb-8">
          <Link href={`/${lang}/admin`} className="inline-block">
            <h2 className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
              Admin Panel
            </h2>
          </Link>
        </div>
        <nav className="space-y-1 flex-grow">
          <Link href={`/${lang}/admin`} className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <Home className="mr-3 h-5 w-5" /> Dashboard
          </Link>
          <Link href={`/${lang}/admin/projects`} className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <GanttChartSquare className="mr-3 h-5 w-5" /> Projects
          </Link>
          <Link href={`/${lang}/admin/experience`} className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <Briefcase className="mr-3 h-5 w-5" /> Experience
          </Link>
          <Link href={`/${lang}/admin/skills`} className="flex items-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <Lightbulb className="mr-3 h-5 w-5" /> Skills
          </Link>
        </nav>
        <div className="mt-auto">
           <Link href={`/${lang}/`} className="flex items-center p-2 rounded-md text-sm hover:bg-secondary hover:text-secondary-foreground transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-5 w-5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            Back to Site
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 lg:p-10 bg-secondary/30 overflow-auto">
        {children}
      </main>
    </div>
  );
}
