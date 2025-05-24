
import { prisma } from '@/lib/prisma';
import type { Experience as JourneyItemType } from '@prisma/client'; 
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import { Accordion } from "@/components/ui/accordion";
import initTranslations from '@/app/i18n'; 
import { defaultNS } from '@/app/i18n/settings';
import JourneyCard from '@/components/JourneyCard'; 

interface JourneyTimelineProps {
  lang: string;
}
async function getJourneyItems(): Promise<JourneyItemType[]> {
   try {
    return await prisma.experience.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  } catch (error: any) {
    console.error("Failed to fetch experience data from DB:", error.message, error.stack);
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
        description={t('journeyTimeline.description')}
      />
      {journeyItems.length > 0 ? (
        <div className="relative">
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            {journeyItems.map((item, index) => (
              <JourneyCard key={item.id} item={item} index={index} />
            ))}
          </Accordion>
        </div>
      ) : (
         <p className="text-center text-muted-foreground">{t('journeyTimeline.noEntries')}</p>
      )}
    </SectionWrapper>
  );
}
