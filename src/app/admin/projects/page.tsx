
import type { Project } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // Import prisma client

// Function to fetch projects directly using Prisma
async function getProjects(): Promise<Project[]> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return projects;
  } catch (e: any) {
    console.error(`Failed to fetch projects directly from DB:`, e.message);
    throw new Error(`Failed to fetch projects. Error: ${e.message}`);
  }
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
    return (
      <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
        <h2 className="text-xl font-semibold">Error Fetching Projects</h2>
        <p>{error}</p>
        <p>Please ensure your database is correctly configured and accessible.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Manage Projects</h1>
        <Button asChild>
          <Link href="/admin/projects/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 && !error && (
        <p className="text-lg text-muted-foreground">No projects found. Click "Add New Project" to get started.</p>
      )}

      {projects.length > 0 && (
         <p className="mb-6 text-muted-foreground">Currently viewing {projects.length} project(s).</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.slug}</CardDescription>
              <CardDescription className="text-sm pt-1">
                {project.shortDescription.substring(0, 100)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-xs text-muted-foreground mb-2">
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
               {project.imageUrl && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Image: <a href={project.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-full">{project.imageUrl}</a>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" asChild disabled>
                <Link href={`/admin/projects/${project.id}/edit`}> {/* Edit link, disabled for now */}
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" disabled> {/* Delete button, disabled for now */}
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensures the page is dynamically rendered
