
import ExperienceForm from '@/components/admin/ExperienceForm';
import { updateExperience } from '@/app/admin/experience/actions';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EditExperiencePageProps {
  params: { id: string };
}

async function getExperience(id: string) {
  const experience = await prisma.experience.findUnique({
    where: { id },
  });
  if (!experience) {
    notFound();
  }
  return experience;
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const experience = await getExperience(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/experience">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to experience entries</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Edit Experience Entry</h1>
      </div>
      <ExperienceForm 
        formType="edit" 
        experience={experience} 
        onSubmitAction={updateExperience as any} // Cast for discriminated union if needed
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
