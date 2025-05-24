
import ProjectForm from '@/components/admin/ProjectForm';
import { updateProject } from '@/app/admin/projects/actions';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EditProjectPageProps {
  params: { id: string };
}

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  });
  if (!project) {
    notFound();
  }
  return project;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const project = await getProject(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to projects</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Edit Project</h1>
      </div>
      <ProjectForm 
        formType="edit" 
        project={project} 
        onSubmitAction={updateProject as (idOrFormData: string | FormData, formData?: FormData) => Promise<any>}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
