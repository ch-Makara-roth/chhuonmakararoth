import { projectsData } from '@/lib/data';
import ProjectCard from '@/components/ProjectCard';
import { SectionWrapper, SectionHeader } from '@/components/layout/SectionWrapper';

export default function ProjectsSection() {
  return (
    <SectionWrapper id="projects" className="bg-secondary/30">
      <SectionHeader
        title="Featured Projects"
        description="A selection of projects I've worked on, showcasing my skills and problem-solving abilities."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projectsData.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionWrapper>
  );
}
