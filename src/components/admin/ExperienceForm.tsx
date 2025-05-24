
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { experienceFormSchema, type ExperienceFormData } from '@/lib/validators/experience-validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Experience } from '@prisma/client';

interface ExperienceFormProps {
  experience?: Experience | null; // For editing, null or undefined for new
  onSubmitAction: (data: ExperienceFormData) => Promise<{ success: boolean; message: string; errors: any | null }>;
  formType: 'create' | 'edit';
}

export default function ExperienceForm({ experience, onSubmitAction, formType }: ExperienceFormProps) {
  const { toast } = useToast();

  const defaultValues: Partial<ExperienceFormData> = {
    title: experience?.title || '',
    company: experience?.company || '',
    date: experience?.date || '',
    description: experience?.description || '',
    tags: experience?.tags.join(', ') || '',
  };
  
  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues,
  });

  const {formState: {isSubmitting}} = form;

  async function onSubmit(data: ExperienceFormData) {
    const result = await onSubmitAction(data);
    if (result.success) {
      toast({
        title: formType === 'create' ? 'Experience Entry Created' : 'Experience Entry Updated',
        description: result.message,
      });
      // Server action should handle redirect.
    } else {
      toast({
        title: 'Error',
        description: result.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          const field = key as keyof ExperienceFormData;
          const message = result.errors[field]?.join ? result.errors[field].join(', ') : result.errors[field];
          if (message && form.getFieldState(field)) {
             form.setError(field, { type: 'server', message });
          }
        });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formType === 'create' ? 'Create New Experience Entry' : 'Edit Experience Entry'}</CardTitle>
        <CardDescription>
          {formType === 'create' ? 'Fill in the details for the new experience entry.' : 'Update the experience entry details.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title / Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tech Solutions Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2023 - Present or Jan 2020 - Dec 2022" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe your responsibilities and achievements..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leadership, Next.js, Project Management" {...field} />
                  </FormControl>
                  <FormDescription>Enter relevant skills or keywords separated by commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (formType === 'create' ? 'Creating...' : 'Saving...') : (formType === 'create' ? 'Create Experience Entry' : 'Save Changes')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
