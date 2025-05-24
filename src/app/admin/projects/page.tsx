
import type { Project } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Pencil, Trash2, PlusCircle } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

function getApiUrl(path: string): string {
  let baseUrl = APP_URL;
  // Replace localhost with 127.0.0.1 to avoid potential IPv6/SSL issues in local dev
  if (baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('localhost', '127.0.0.1');
  }
  return `${baseUrl}${path}`;
}

async function getProjects(): Promise<Project[]> {
  const apiUrl = getApiUrl('/api/projects');
  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to fetch projects:', res.status, errorText);
    throw new Error(`Failed to fetch projects. Status: ${res.status}`);
  }
  return res.json();
}

export default async function AdminProjectsPage() {
  let projects: Project[] = [];
  let error: string | null = null;

  try {
    projects = await getProjects();
  } catch (e: any) {
    error = e.message || 'An unknown error occurred.';
  }

  if (error) {
    const apiUrlForErrorMessage = getApiUrl('/api/projects');
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Projects</h2>
        <p>{error}</p>
        <p>Please ensure the API endpoint at <code className="text-sm bg-destructive-foreground/20 px-1 rounded">{apiUrlForErrorMessage}</code> is running and accessible.</p>
      </div>
    );
  }
  
  if (!projects || projects.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Manage Projects</h1>
          {/* <Button asChild variant="default">
            <Link href="/admin/projects/new"><PlusCircle className="mr-2 h-5 w-5" />Add New Project</Link>
          </Button> */}
        </div>
        <p className="text-lg text-muted-foreground">No projects found. CRUD operations coming soon!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Projects</h1>
        {/* <Button asChild variant="default">
          <Link href="/admin/projects/new"><PlusCircle className="mr-2 h-5 w-5" />Add New Project</Link>
        </Button> */}
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
            {/* <CardFooter className="mt-auto pt-4 border-t">
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/admin/projects/edit/${project.slug}`}><Pencil className="mr-1 h-4 w-4" />Edit</Link>
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" disabled> 
                  <Trash2 className="mr-1 h-4 w-4" />Delete
                </Button>
              </div>
            </CardFooter> */}
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
