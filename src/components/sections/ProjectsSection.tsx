
import { prisma } from '@/lib/prisma';
import type { Project } from '@prisma/client';
import ProjectCard from '@/components/ProjectCard';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import initTranslations from '@/app/i18n';
import { defaultNS } from '@/app/i18n/settings';

async function getProjects(): Promise<Project[]> {
  console.log(`[ProjectsSection] Fetching projects from DB at ${new Date().toISOString()}`);
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc', // Changed from createdAt to updatedAt
      },
    });
    console.log(`[ProjectsSection] Fetched ${projects.length} projects. First project title (if any): ${projects[0]?.title}`);
    return projects;
  } catch (error) {
    console.error("[ProjectsSection] Failed to fetch projects from DB:", error);
    return [];
  }
}

interface ProjectsSectionProps {
  lang: string;
}

export default async function ProjectsSection({ lang }: ProjectsSectionProps) {
  const projects = await getProjects();
  const { t } = await initTranslations(lang, [defaultNS]);

  return (
    <SectionWrapper id="projects" className="bg-secondary/30">
      <SectionHeader
        title={t('header.projects')}
        description={t('projectsSection.description')}
      />
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project as any} lang={lang} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{t('projectsSection.noProjects')}</p>
      )}
    </SectionWrapper>
  );
}
