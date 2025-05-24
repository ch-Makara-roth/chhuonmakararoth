
import { prisma } from '@/lib/prisma';
import type { Skill as SkillType } from '@prisma/client'; // Prisma's Skill model
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import initTranslations from '@/app/i18n';
import { defaultNS } from '@/app/i18n/settings';
import SkillCard from '@/components/SkillCard'; 

interface SkillBloomProps {
  lang: string;
}

async function getSkills(): Promise<SkillType[]> {
  try {
    return await prisma.skill.findMany({
      orderBy: [
        { category: 'asc' },
        { proficiency: 'desc' },
        { name: 'asc' },
      ],
    });
  } catch (error: any) {
    console.error("Failed to fetch skills from DB:", error.message, error.stack);
    return [];
  }
}

export default async function SkillBloom({ lang }: SkillBloomProps) {
  const skills = await getSkills();
  const { t } = await initTranslations(lang, [defaultNS]);

  return (
    <SectionWrapper id="skills">
      <SectionHeader
        title={t('header.skills')}
        description={t('skillBloom.description')}
      />
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{t('skillBloom.noSkills')}</p>
      )}
    </SectionWrapper>
  );
}
