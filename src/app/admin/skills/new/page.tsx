
import SkillForm from '@/components/admin/SkillForm';
import { createSkill } from '@/app/admin/skills/actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewSkillPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/skills">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to skills</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Add New Skill</h1>
      </div>
      <SkillForm onSubmitAction={createSkill} formType="create" />
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensure server actions work correctly

