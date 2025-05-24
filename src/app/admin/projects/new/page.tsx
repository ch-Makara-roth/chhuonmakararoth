
import ProjectForm from '@/components/admin/ProjectForm';
import { createProject } from '@/app/admin/projects/actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to projects</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Add New Project</h1>
      </div>
      <ProjectForm onSubmitAction={createProject} formType="create" />
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensure server actions work correctly
