
import { projectsData, type Project } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, ExternalLink, Github, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { languages, defaultNS, defaultLocale } from '@/app/i18n/settings';
import initTranslations from '@/app/i18n';

async function getProject(slug: string): Promise<Project | undefined> {
  // In a real app, this would fetch based on slug and possibly locale
  return projectsData.find((p) => p.slug === slug);
}

export async function generateStaticParams() {
  const params: Array<{ lang: string, slug: string }> = [];
  languages.forEach(lang => {
    projectsData.forEach(project => {
      params.push({ lang, slug: project.slug });
    });
  });
  return params;
}

export async function generateMetadata({ params }: { params: { slug: string, lang: string } }) {
  const project = await getProject(params.slug);
  // const { t } = await initTranslations(params.lang, [defaultNS]);
  if (!project) {
    return { title: 'Project Not Found' } // TODO: Translate this
  }
  return {
    // title: `${project.title} - ${t('header.appName')}`, // Example of using translated app name
    title: `${project.title} - Chhuon MakaraRoth Dev`, // Keeping simple for now
    description: project.shortDescription, // TODO: Translate this
  };
}

interface ProjectDetailPageProps {
  params: { slug: string; lang: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { lang, slug } = params;
  const project = await getProject(slug);
  const { t } = await initTranslations(lang, [defaultNS]);

  if (!project) {
    notFound();
  }

  const backToProjectsPath = lang === defaultLocale ? '/#projects' : `/${lang}/#projects`;

  return (
    <div className="min-h-screen py-12 md:py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <Button asChild variant="outline" className="mb-8 group">
          <Link href={backToProjectsPath}>
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {t('projectDetails.backToProjects')}
          </Link>
        </Button>

        <article className="bg-card p-6 sm:p-8 md:p-10 rounded-lg shadow-xl">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-3">{project.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span>{project.startDate} {project.endDate ? `- ${project.endDate}` : '- Present'}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm">{tech}</Badge>
              ))}
            </div>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md mb-6">
              <Image 
                src={project.imageUrl} 
                alt={`${project.title} main image`} 
                layout="fill" 
                objectFit="cover"
                data-ai-hint={project.dataAiHint || "project detail"}
              />
            </div>
          </header>

          <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90">
            <p className="lead text-xl mb-6">{project.description}</p>
            
            {project.features && project.features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-3 flex items-center"><ListChecks className="mr-3 h-6 w-6 text-accent" />Key Features</h2>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {project.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {project.detailsImages && project.detailsImages.length > 0 && (
              <div className="my-8">
                <h2 className="text-2xl font-semibold mb-4">Screenshots</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.detailsImages.map((imgUrl, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-md overflow-hidden shadow">
                       <Image 
                        src={imgUrl} 
                        alt={`${project.title} screenshot ${index + 1}`} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint={project.dataAiHint || "screenshot interface"}
                       />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="mt-10 pt-6 border-t">
            <div className="flex flex-wrap gap-4 items-center">
              {project.liveLink && (
                <Button asChild variant="default" size="lg">
                  <a href={project.liveLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" /> Live Demo
                  </a>
                </Button>
              )}
              {project.repoLink && (
                <Button asChild variant="outline" size="lg">
                  <a href={project.repoLink} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" /> View Code
                  </a>
                </Button>
              )}
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
