
"use client";

import type { Skill as SkillType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Database, Server, Smartphone, Wrench, Palette, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { defaultNS } from '@/app/i18n/settings';

const categoryIcons: Record<string, LucideIcon> = { 
  Frontend: Palette,
  Backend: Database,
  DevOps: Server,
  Mobile: Smartphone,
  Tools: Wrench,
  Other: Target,
};

interface SkillCardProps {
  skill: SkillType;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const { t } = useTranslation(defaultNS);
  const Icon = categoryIcons[skill.category] || Target;

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
