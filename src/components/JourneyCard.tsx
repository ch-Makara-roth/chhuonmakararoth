
"use client";

import type { Experience as JourneyItemType } from '@prisma/client';
import { useEffect, useState, useRef } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { defaultNS } from '@/app/i18n/settings';

interface JourneyCardProps {
  item: JourneyItemType;
  index: number;
}

export default function JourneyCard({ item, index }: JourneyCardProps) {
  const { t } = useTranslation(defaultNS); // Use hook for translations
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div 
      ref={ref}
      className={`relative pl-8 sm:pl-12 py-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 150}ms`}}
    >
      <div className="absolute left-0 sm:left-4 top-6 h-full w-0.5 bg-border -translate-x-1/2"></div>
      <div className="absolute left-0 sm:left-4 top-6 w-4 h-4 rounded-full bg-primary border-2 border-background -translate-x-1/2"></div>
      
      <AccordionItem value={item.id} className="border-none">
        <AccordionTrigger className="hover:no-underline p-0">
          <div className="text-left w-full">
            <div className="flex items-center mb-1">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <time className="text-sm font-semibold text-muted-foreground">{item.date}</time>
            </div>
            <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
            {item.company && (
              <p className="text-md text-primary flex items-center">
                <Briefcase className="h-4 w-4 mr-2" /> {item.company}
              </p>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-0">
          <p className="text-foreground/80 mb-3">{item.description}</p>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};
