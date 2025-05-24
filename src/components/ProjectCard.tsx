
import Image from 'next/image';
import Link from 'next/link';
import { type Project } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Github, ExternalLink } from 'lucide-react';
import { defaultLocale } from '@/app/i18n/settings';

interface ProjectCardProps {
  project: Project;
  lang: string; 
}

export default function ProjectCard({ project, lang }: ProjectCardProps) {
  const projectDetailPath = lang === defaultLocale ? `/projects/${project.slug}` : `/${lang}/projects/${project.slug}`;
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-accent/20 transition-all duration-300 transform hover:scale-[1.02]">
      <CardHeader className="p-0">
        <div className="aspect-video relative w-full">
          <Image
            src={project.imageUrl}
            alt={project.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-500 group-hover:scale-105"
            data-ai-hint={project.dataAiHint || "project image"}
          />
        </div>
      </CardHeader>
      <div className="p-6 flex flex-col flex-grow">
        <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
        <CardDescription className="text-foreground/80 mb-4 text-sm flex-grow">{project.shortDescription}</CardDescription>
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Technologies:</h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </div>
      </div>
      <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row sm:justify-between gap-3 items-stretch sm:items-center">
        <Button asChild variant="default" className="w-full sm:w-auto">
          <Link href={projectDetailPath}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {project.liveLink && (
            <Button asChild variant="outline" size="icon" className="w-9 h-9 flex-shrink-0">
              <a href={project.liveLink} target="_blank" rel="noopener noreferrer" aria-label="Live Preview">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {project.repoLink && (
            <Button asChild variant="outline" size="icon" className="w-9 h-9 flex-shrink-0">
              <a href={project.repoLink} target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
