
'use client';
import { projectsData } from '@/lib/data';
import ProjectCard from '@/components/ProjectCard';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import { useTranslation } from 'react-i18next';
// No need to import useParams if we use i18n.language
// import { useParams } from 'next/navigation';
// No need to import defaultLocale here if ProjectCard handles its own path logic based on passed lang
// import { defaultLocale } from '@/app/i18n/settings'; 

export default function ProjectsSection() {
  const { i18n, t } = useTranslation('common'); // t for section title/desc if needed
  const currentLang = i18n.language;
  
  return (
    <SectionWrapper id="projects" className="bg-secondary/30">
      <SectionHeader
        title={t('header.projects')} // Example: Translate section title
        description="A selection of projects I've worked on, showcasing my skills and problem-solving abilities." // This description also needs translation
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projectsData.map((project) => (
          <ProjectCard key={project.id} project={project} lang={currentLang} />
        ))}
      </div>
    </SectionWrapper>
  );
}
