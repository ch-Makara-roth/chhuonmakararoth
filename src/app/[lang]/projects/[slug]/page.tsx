
import { prisma } from '@/lib/prisma';
import type { Project as ProjectType } from '@prisma/client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, ExternalLink, Github, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { languages, defaultNS, defaultLocale } from '@/app/i18n/settings';
import initTranslations from '@/app/i18n';
import type { Metadata } from 'next';

async function getProject(slug: string): Promise<ProjectType | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
    });
    return project;
  } catch (error) {
    console.error(`Error fetching project with slug ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    select: { slug: true },
  });

  const params: Array<{ lang: string, slug: string }> = [];
  languages.forEach(lang => {
    projects.forEach(project => {
      if (project.slug) {
         params.push({ lang, slug: project.slug });
      }
    });
  });
  return params;
}

export async function generateMetadata({ params }: { params: { slug: string, lang: string } }): Promise<Metadata> {
  const { slug, lang } = await params;
  const project = await getProject(slug);
  const { t } = await initTranslations(lang, [defaultNS]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!project) {
    return { 
      title: t('projectDetails.notFound') || 'Project Not Found',
      description: 'The project you are looking for could not be found.',
     }
  }

  const projectTitle = project.title;
  const pageTitle = `${projectTitle} - ${t('header.appName')}`;
  const pageDescription = project.shortDescription;
  const projectUrlPath = lang === defaultLocale ? `/projects/${project.slug}` : `/${lang}/projects/${project.slug}`;
  const fullProjectUrl = appUrl ? `${appUrl}${projectUrlPath}` : undefined;


  return {
    title: pageTitle,
    description: pageDescription,
    metadataBase: appUrl ? new URL(appUrl) : undefined,
    alternates: {
      canonical: projectUrlPath,
    },
    openGraph: {
      title: projectTitle,
      description: pageDescription,
      url: fullProjectUrl,
      siteName: t('header.appName'),
      images: project.imageUrl ? [
        {
          url: project.imageUrl, // Assuming imageUrl is an absolute URL or Next.js can resolve it
          width: project.imageUrl.includes('placehold.co') ? 600 : 1200, // Adjust if you know image dimensions
          height: project.imageUrl.includes('placehold.co') ? 400 : 630,
          alt: projectTitle,
        },
      ] : [],
      locale: lang,
      type: 'article', // More specific type for a project page
      // publishedTime: project.createdAt?.toISOString(), // Optional: if you have a createdAt field
      // modifiedTime: project.updatedAt?.toISOString(), // Optional: if you have an updatedAt field
    },
    twitter: {
      card: 'summary_large_image',
      title: projectTitle,
      description: pageDescription,
      images: project.imageUrl ? [project.imageUrl] : [],
      // creator: '@yourTwitterHandle', // Optional
    },
  };
}

interface ProjectDetailPageProps {
  params: { slug: string; lang: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { lang, slug } = await params;
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
              <span>{project.startDate} {project.endDate ? `- ${project.endDate}` : `- ${t('projectDetails.present') || 'Present'}`}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm">{tech}</Badge>
              ))}
            </div>
            {project.imageUrl && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md mb-6">
                <Image 
                  src={project.imageUrl} 
                  alt={`${project.title} main image`} 
                  fill // Changed layout to fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Added sizes prop
                  className="object-cover" // ensure image covers the container
                  data-ai-hint={project.dataAiHint || "project detail"}
                />
              </div>
            )}
          </header>

          <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90">
            <p className="lead text-xl mb-6">{project.description}</p>
            
            {project.features && project.features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-3 flex items-center"><ListChecks className="mr-3 h-6 w-6 text-accent" />{t('projectDetails.keyFeatures') || 'Key Features'}</h2>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {project.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {project.detailsImages && project.detailsImages.length > 0 && (
              <div className="my-8">
                <h2 className="text-2xl font-semibold mb-4">{t('projectDetails.screenshots') || 'Screenshots'}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.detailsImages.map((imgUrl, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-md overflow-hidden shadow">
                       <Image 
                        src={imgUrl} 
                        alt={`${project.title} screenshot ${index + 1}`} 
                        fill // Changed layout to fill
                        sizes="(max-width: 640px) 100vw, 50vw" // Added sizes prop
                        className="object-cover" // ensure image covers the container
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
                    <ExternalLink className="mr-2 h-5 w-5" /> {t('projectDetails.liveDemo') || 'Live Demo'}
                  </a>
                </Button>
              )}
              {project.repoLink && (
                <Button asChild variant="outline" size="lg">
                  <a href={project.repoLink} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" /> {t('projectDetails.viewCode') || 'View Code'}
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
