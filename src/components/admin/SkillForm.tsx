
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { skillFormSchema, type SkillFormData } from '@/lib/validators/skill-validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Skill } from '@prisma/client';
import { useRouter } from 'next/navigation';
import type { SkillActionResponse } from '@/app/admin/skills/actions';

interface SkillFormProps {
  skill?: Skill | null;
  formType: 'create' | 'edit';
  onSubmitAction: (data: SkillFormData) => Promise<SkillActionResponse> | ((id: string, data: SkillFormData) => Promise<SkillActionResponse>);
}

export default function SkillForm({ skill, onSubmitAction, formType }: SkillFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const defaultValues: Partial<SkillFormData> = {
    name: skill?.name || '',
    category: skill?.category || '',
    proficiency: skill?.proficiency || 0,
    technologies: skill?.technologies.join(', ') || '',
  };
  
  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues,
    mode: 'onChange', 
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: SkillFormData) {
    let result: SkillActionResponse;
    if (formType === 'edit' && skill?.id) {
      result = await (onSubmitAction as (id: string, data: SkillFormData) => Promise<SkillActionResponse>)(skill.id, data);
    } else {
      result = await (onSubmitAction as (data: SkillFormData) => Promise<SkillActionResponse>)(data);
    }

    if (result.success) {
      toast({
        title: formType === 'create' ? 'Skill Created' : 'Skill Updated',
        description: result.message,
      });
      router.push('/admin/skills');
    } else {
      toast({
        title: 'Error',
        description: result.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      if (result.errors) {
        (Object.keys(result.errors) as Array<keyof SkillFormData>).forEach((key) => {
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
        <CardTitle>{formType === 'create' ? 'Create New Skill' : `Edit Skill: ${skill?.name || ''}`}</CardTitle>
        <CardDescription>
          {formType === 'create' ? 'Fill in the details for the new skill.' : 'Update the skill details.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., JavaScript" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Frontend, Backend, Tools" {...field} />
                  </FormControl>
                  <FormDescription>Enter the skill category.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proficiency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proficiency (0-100)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 85" {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="technologies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Technologies (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., React, Node.js" {...field} />
                  </FormControl>
                  <FormDescription>Enter related tools or frameworks, separated by commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (formType === 'create' ? 'Creating...' : 'Saving...') : (formType === 'create' ? 'Create Skill' : 'Save Changes')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
