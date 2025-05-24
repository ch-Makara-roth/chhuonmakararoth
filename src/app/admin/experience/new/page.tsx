
import ExperienceForm from '@/components/admin/ExperienceForm';
import { createExperience } from '@/app/admin/experience/actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewExperiencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/experience">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to experience entries</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Add New Experience Entry</h1>
      </div>
      <ExperienceForm onSubmitAction={createExperience} formType="create" />
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensure server actions work correctly
