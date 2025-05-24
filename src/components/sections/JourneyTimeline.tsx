
"use client"; // JourneyCard within needs to be client for animations

import { prisma } from '@/lib/prisma';
import type { Experience as JourneyItemType } from '@prisma/client'; // Prisma's Experience model
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CalendarDays } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import initTranslations from '@/app/i18n'; // For server-side translations
import { defaultNS } from '@/app/i18n/settings';


// JourneyCard remains a client component for animations
const JourneyCard = ({ item, index, t }: { item: JourneyItemType; index: number; t: (key: string, fallback?: string) => string }) => {
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

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
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


// JourneyTimeline becomes an async Server Component
interface JourneyTimelineProps {
  lang: string;
}
async function getJourneyItems(): Promise<JourneyItemType[]> {
   try {
    return await prisma.experience.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  } catch (error) {
    console.error("Failed to fetch experience data from DB:", error);
    return [];
  }
}

export default async function JourneyTimeline({ lang }: JourneyTimelineProps) {
  const journeyItems = await getJourneyItems();
  const { t } = await initTranslations(lang, [defaultNS]);

  return (
    <SectionWrapper id="journey" className="bg-secondary/30">
      <SectionHeader
        title={t('header.journey')}
        description={t('journeyTimeline.description', "A timeline of my career progression, key milestones, and professional growth.")}
      />
      {journeyItems.length > 0 ? (
        <div className="relative">
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            {journeyItems.map((item, index) => (
              // Pass t function to JourneyCard for any internal text
              <JourneyCard key={item.id} item={item} index={index} t={t} />
            ))}
          </Accordion>
        </div>
      ) : (
         <p className="text-center text-muted-foreground">{t('journeyTimeline.noEntries', 'No journey entries available at the moment.')}</p>
      )}
    </SectionWrapper>
  );
}
