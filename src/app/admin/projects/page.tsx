
import type { Project } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Manage Projects</h1>
        <Button asChild>
          <Link href="/admin/projects/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 && !error && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground">No projects found. Click "Add New Project" to get started.</p>
          </CardContent>
        </Card>
      )}

      {projects.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Technologies</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.slug}</TableCell>
                    <TableCell className="text-sm">
                      {project.startDate} {project.endDate ? `- ${project.endDate}` : '- Present'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           {projects.length > 0 && (
            <CardFooter className="justify-between items-center py-4 px-6 border-t">
                <p className="text-sm text-muted-foreground">
                    Total {projects.length} project(s).
                </p>
                {/* Placeholder for pagination */}
            </CardFooter>
            )}
        </Card>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
