"use client";

import { skillsData, type Skill } from '@/lib/data';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Database, Server, Smartphone, Wrench, Palette } from 'lucide-react'; // Example icons

const categoryIcons: Record<Skill['category'], React.ElementType> = {
  Frontend: Palette,
  Backend: Database,
  DevOps: Server,
  Mobile: Smartphone,
  Tools: Wrench,
  Other: Target,
};

const SkillCard = ({ skill }: { skill: Skill }) => {
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
              <p>Proficiency: {skill.proficiency}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {skill.technologies && skill.technologies.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Related:</h4>
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

export default function SkillBloom() {
  return (
    <SectionWrapper id="skills">
      <SectionHeader
        title="Skills & Expertise"
        description="A curated list of my technical skills, tools, and technologies I'm proficient with."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skillsData.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </SectionWrapper>
  );
}
