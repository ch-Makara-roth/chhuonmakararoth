
"use client"; // SkillCard within needs to be client for tooltips

import { prisma } from '@/lib/prisma';
import type { Skill as SkillType } from '@prisma/client'; // Prisma's Skill model
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Database, Server, Smartphone, Wrench, Palette, LucideIcon } from 'lucide-react';
import initTranslations from '@/app/i18n';
import { defaultNS } from '@/app/i18n/settings';

// SkillCard remains a client component for tooltips
const categoryIcons: Record<SkillType['category'], LucideIcon> = {
  Frontend: Palette,
  Backend: Database,
  DevOps: Server,
  Mobile: Smartphone,
  Tools: Wrench,
  Other: Target,
};

const SkillCard = ({ skill, t }: { skill: SkillType; t: (key: string, fallback?: string) => string }) => {
  const Icon = categoryIcons[skill.category as keyof typeof categoryIcons] || Target; // Cast category for safety

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{skill.name}</CardTitle>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>{skill.category}</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={skill.proficiency} className="w-full h-3" aria-label={`${skill.name} proficiency ${skill.proficiency}%`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('skillBloom.proficiency', 'Proficiency')}: {skill.proficiency}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {skill.technologies && skill.technologies.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">{t('skillBloom.related', 'Related')}:</h4>
            <div className="flex flex-wrap gap-1">
              {skill.technologies.map(tech => (
                <span key={tech} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


// SkillBloom becomes an async Server Component
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
  } catch (error) {
    console.error("Failed to fetch skills from DB:", error);
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
        description={t('skillBloom.description', "A curated list of my technical skills, tools, and technologies I'm proficient with.")}
      />
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {skills.map((skill) => (
            // Pass t function to SkillCard
            <SkillCard key={skill.id} skill={skill} t={t} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{t('skillBloom.noSkills', 'No skills available at the moment.')}</p>
      )}
    </SectionWrapper>
  );
}
