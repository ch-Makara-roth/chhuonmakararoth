
import type { Project } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { languages } from '@/app/i18n/settings';

async function getProjects(): Promise<Project[]> {
  const apiPath = '/api/projects';
  const res = await fetch(apiPath, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch projects from ${apiPath}:`, res.status, errorText);
    throw new Error(`Failed to fetch projects from ${apiPath}. Status: ${res.status}`);
  }
  return res.json();
}

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

interface AdminProjectsPageProps {
  params: { lang: string };
}

export default async function AdminProjectsPage({ params: { lang } }: AdminProjectsPageProps) {
  let projects: Project[] = [];
  let error: string | null = null;

  try {
    projects = await getProjects();
  } catch (e: any) {
    error = e.message || 'An unknown error occurred.';
  }

  if (error) {
    const apiPathForErrorMessage = '/api/projects';
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Projects</h2>
        <p>{error}</p>
        <p>Please ensure the API endpoint at <code className="text-sm bg-destructive-foreground/20 px-1 rounded">{apiPathForErrorMessage}</code> is running and accessible, and your database is correctly configured and seeded.</p>
      </div>
    );
  }
  
  if (!projects || projects.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Manage Projects</h1>
        </div>
        <p className="text-lg text-muted-foreground">No projects found. CRUD operations and the ability to add projects will be implemented soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Projects</h1>
      </div>
      <p className="mb-6 text-muted-foreground">Currently viewing {projects.length} project(s). Full CRUD functionality will be added soon.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.shortDescription.substring(0, 100)}...</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2">
                Dates: {project.startDate} {project.endDate ? `- ${project.endDate}` : '- Present'}
              </p>
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Technologies:</h4>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
