
import SkillForm from '@/components/admin/SkillForm';
import { updateSkill } from '@/app/admin/skills/actions';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EditSkillPageProps {
  params: { id: string };
}

async function getSkill(id: string) {
  const skill = await prisma.skill.findUnique({
    where: { id },
  });
  if (!skill) {
    notFound();
  }
  return skill;
}

export default async function EditSkillPage({ params }: EditSkillPageProps) {
  const skill = await getSkill(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/skills">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to skills</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Edit Skill</h1>
      </div>
      <SkillForm 
        formType="edit" 
        skill={skill} 
        onSubmitAction={updateSkill as any} // Cast for discriminated union if needed
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
