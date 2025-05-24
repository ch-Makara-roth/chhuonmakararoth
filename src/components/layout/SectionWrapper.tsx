import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

interface SectionWrapperProps extends PropsWithChildren {
  className?: string;
  id?: string;
}

export function SectionWrapper({ children, className, id }: SectionWrapperProps) {
  return (
    <section id={id} className={cn('w-full py-16 md:py-24 lg:py-32 border-b', className)}>
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-12 md:mb-16 text-center">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-primary">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          {description}
        </p>
      )}
    </div>
  );
}
