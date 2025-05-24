'use client';
import { projectsData } from '@/lib/data';
import ProjectCard from '@/components/ProjectCard';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';
import { useParams } from 'next/navigation';

export default function ProjectsSection() {
  const params = useParams();
  const lang = typeof params.lang === 'string' ? params.lang : 'en';
  
  return (
    <SectionWrapper id="projects" className="bg-secondary/30">
      <SectionHeader
        title="Featured Projects" // This title also needs translation
        description="A selection of projects I've worked on, showcasing my skills and problem-solving abilities." // This description also needs translation
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projectsData.map((project) => (
          <ProjectCard key={project.id} project={project} lang={lang} />
        ))}
      </div>
    </SectionWrapper>
  );
}
