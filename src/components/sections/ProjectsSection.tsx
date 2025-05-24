
import { prisma } from '@/lib/prisma';
import type { Project } from '@prisma/client';
import ProjectCard from '@/components/ProjectCard';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import { useTranslation } from 'react-i18next'; // Keep for t function if used for section title/desc
import initTranslations from '@/app/i18n'; // For server-side translations
import { defaultNS, languages } from '@/app/i18n/settings';
import {unstable_setRequestLocale} from 'next-intl/server'; // If using next-intl, otherwise remove

async function getProjects(): Promise<Project[]> {
  try {
    return await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error("Failed to fetch projects from DB:", error);
    return [];
  }
}

// Helper to get current language on server side
// This might not be directly needed if `useTranslation` with `initTranslations` works well enough
// or if `lang` is passed as a prop from a higher-level server component.
// For simplicity, if `ProjectsSection` is used directly in `app/[lang]/page.tsx`,
// it will inherit `lang` from params implicitly or explicitly.

interface ProjectsSectionProps {
  lang: string;
}

export default async function ProjectsSection({ lang }: ProjectsSectionProps) {
  // `lang` prop is now expected.
  // If using next-intl for locale management (not currently the case), you might use:
  // unstable_setRequestLocale(lang); 
  
  const projects = await getProjects();
  const { t } = await initTranslations(lang, [defaultNS]);

  return (
    <SectionWrapper id="projects" className="bg-secondary/30">
      <SectionHeader
        title={t('header.projects')}
        description={t('projectsSection.description', "A selection of projects I've worked on, showcasing my skills and problem-solving abilities.")}
      />
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} lang={lang} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{t('projectsSection.noProjects', 'No projects available at the moment.')}</p>
      )}
    </SectionWrapper>
  );
}
