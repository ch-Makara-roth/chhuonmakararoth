
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectFormSchema, type ProjectFormData } from '@/lib/validators/project-validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@prisma/client';

type ProjectActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof ProjectFormData, string[]>> | null;
};

interface ProjectFormProps {
  project?: Project | null;
  onSubmitAction: (data: ProjectFormData) => Promise<ProjectActionResponse>;
  formType: 'create' | 'edit';
}

export default function ProjectForm({ project, onSubmitAction, formType }: ProjectFormProps) {
  const { toast } = useToast();

  const defaultValues: Partial<ProjectFormData> = {
    title: project?.title || '',
    slug: project?.slug || '',
    shortDescription: project?.shortDescription || '',
    description: project?.description || '',
    imageUrl: project?.imageUrl || '',
    dataAiHint: project?.dataAiHint || '',
    technologies: project?.technologies.join(', ') || '',
    liveLink: project?.liveLink || '',
    repoLink: project?.repoLink || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    detailsImagesString: project?.detailsImages.join(', ') || '',
    featuresString: project?.features.join(', ') || '',
  };
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  const {formState: {isSubmitting}} = form;

  async function onSubmit(data: ProjectFormData) {
    const result = await onSubmitAction(data);
    if (result.success) {
      toast({
        title: formType === 'create' ? 'Project Created' : 'Project Updated',
        description: result.message,
      });
    } else {
      toast({
        title: 'Error',
        description: result.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      if (result.errors) {
        (Object.keys(result.errors) as Array<keyof ProjectFormData>).forEach((key) => {
          const fieldErrors = result.errors?.[key];
          const message = fieldErrors?.join ? fieldErrors.join(', ') : String(fieldErrors);
          if (message && form.getFieldState(key)) {
             form.setError(key, { type: 'server', message });
          }
        });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formType === 'create' ? 'Create New Project' : 'Edit Project'}</CardTitle>
        <CardDescription>
          {formType === 'create' ? 'Fill in the details for the new project.' : 'Update the project details.'}
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="project-slug (auto-generated if empty)" {...field} />
                  </FormControl>
                  <FormDescription>Lowercase alphanumeric characters and hyphens only.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief summary of the project..." {...field} rows={3} />
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
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detailed description of the project..." {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dataAiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image AI Hint (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'tech website' or 'nature landscape'" {...field} />
                  </FormControl>
                   <FormDescription>One or two keywords for AI image generation services.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technologies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technologies (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="React, Next.js, Tailwind CSS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="liveLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Live Demo Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://project-live-demo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repoLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/user/project-repo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jan 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mar 2023 or Present" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="detailsImagesString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detail Page Image URLs (comma-separated, optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="url1, url2, url3" {...field} rows={2} />
                  </FormControl>
                  <FormDescription>Enter valid URLs separated by commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featuresString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Features (comma-separated, optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Feature 1, Feature 2, Feature 3" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (formType === 'create' ? 'Creating...' : 'Saving...') : (formType === 'create' ? 'Create Project' : 'Save Changes')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
