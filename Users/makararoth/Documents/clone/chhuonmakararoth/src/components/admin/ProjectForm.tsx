
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectFormSchema, type ProjectClientFormData, MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES } from '@/lib/validators/project-validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@prisma/client';
import { useRouter } from 'next/navigation';
import type { ProjectActionResponse } from '@/app/admin/projects/actions';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { z } from 'zod'; // Added missing Zod import

interface ProjectFormProps {
  project?: Project | null;
  formType: 'create' | 'edit';
  onSubmitAction: (idOrFormData: string | FormData, formData?: FormData) => Promise<ProjectActionResponse>;
}

// Client-side Zod schema for react-hook-form
const clientSchema = projectFormSchema.extend({
  imageFile: z.custom<FileList | null | undefined>(
    (val) => val === undefined || val === null || val instanceof FileList,
    "Invalid file input"
  )
  .refine(
    (files) => (formType === 'create' && files?.[0]) ? files[0].size <= MAX_FILE_SIZE_BYTES : true, // Required on create, optional on edit for size
    `Max image size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
  )
  .refine(
    (files) => (files?.[0]) ? ACCEPTED_IMAGE_TYPES.includes(files[0].type) : true, // Validate type if file exists
    "Only .jpg, .jpeg, .png, .webp, .gif formats are supported."
  )
  .optional(),
  currentImageUrl: z.string().optional(), // Not for submission, just for form state
});
let formType: 'create' | 'edit' = 'create'; // Variable to hold formType for schema refs

export default function ProjectForm({ project, formType: formTypeProp, onSubmitAction }: ProjectFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  formType = formTypeProp; // Assign prop to module-level variable for schema

  const [previewImage, setPreviewImage] = useState<string | null>(project?.imageUrl || null);

  const defaultValues: Partial<ProjectClientFormData> = {
    title: project?.title || '',
    slug: project?.slug || '',
    shortDescription: project?.shortDescription || '',
    description: project?.description || '',
    // imageUrl is not directly set for file input via RHF defaults
    dataAiHint: project?.dataAiHint || '',
    technologies: project?.technologies.join(', ') || '',
    liveLink: project?.liveLink || '',
    repoLink: project?.repoLink || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    detailsImagesString: project?.detailsImages.join(', ') || '',
    featuresString: project?.features.join(', ') || '',
    imageFile: null,
    currentImageUrl: project?.imageUrl || undefined,
  };
  
  const form = useForm<ProjectClientFormData>({
    resolver: zodResolver(clientSchema), // Use client-specific schema
    defaultValues,
    mode: 'onChange',
  });

  const { formState: { isSubmitting, errors }, watch } = form;

  const imageFileWatch = watch("imageFile");

  useEffect(() => {
    if (imageFileWatch && imageFileWatch.length > 0) {
      const file = imageFileWatch[0];
      if (file && ACCEPTED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE_BYTES) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // If file is invalid, clear preview or show existing
        setPreviewImage(project?.imageUrl || null);
      }
    } else if (project?.imageUrl) {
      setPreviewImage(project.imageUrl);
    } else {
        setPreviewImage(null);
    }
  }, [imageFileWatch, project?.imageUrl]);


  async function onSubmit(data: ProjectClientFormData) {
    const formData = new FormData();

    // Append text fields
    (Object.keys(data) as Array<keyof ProjectClientFormData>).forEach((key) => {
      if (key !== 'imageFile' && key !== 'currentImageUrl' && data[key] !== undefined && data[key] !== null) {
        // Ensure slugs are correctly handled (empty string vs. undefined)
        if (key === 'slug' && data[key] === '') {
          // Don't append if slug is explicitly empty, let server handle auto-generation
        } else {
          formData.append(key, String(data[key]));
        }
      }
    });
    
    // Append file if selected
    if (data.imageFile && data.imageFile.length > 0) {
      formData.append('imageFile', data.imageFile[0]);
    }
    // If editing and no new file, server action will use existing imageUrl from DB.

    let result: ProjectActionResponse;
    if (formTypeProp === 'edit' && project?.id) {
      result = await onSubmitAction(project.id, formData);
    } else {
      result = await onSubmitAction(formData);
    }

    if (result.success) {
      toast({
        title: formTypeProp === 'create' ? 'Project Created' : 'Project Updated',
        description: result.message,
      });
      router.push('/admin/projects');
      router.refresh(); // Ensure list is updated
    } else {
      toast({
        title: 'Error',
        description: result.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      if (result.errors) {
        (Object.keys(result.errors) as Array<keyof ProjectClientFormData | "_form">).forEach((key) => {
          const fieldErrors = result.errors?.[key as keyof ProjectClientFormData]; // Cast to ProjectClientFormData
          const message = Array.isArray(fieldErrors) ? fieldErrors.join(', ') : String(fieldErrors);
          
          if (key === "_form") { // Handle general form error
             toast({
              title: 'Form Error',
              description: message,
              variant: 'destructive',
            });
          } else if (message && form.getFieldState(key as keyof ProjectClientFormData)) {
             form.setError(key as keyof ProjectClientFormData, { type: 'server', message });
          }
        });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formTypeProp === 'create' ? 'Create New Project' : `Edit Project: ${project?.title || ''}`}</CardTitle>
        <CardDescription>
          {formTypeProp === 'create' ? 'Fill in the details for the new project.' : 'Update the project details.'}
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="project-slug (auto-generated if empty and creating)" {...field} />
                  </FormControl>
                  <FormDescription>
                    {formTypeProp === 'create' 
                      ? "Leave empty to auto-generate from title. Must be unique, lowercase alphanumeric with hyphens."
                      : "Must be unique, lowercase alphanumeric with hyphens. Modifying slugs can affect SEO."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {previewImage && (
              <FormItem>
                <FormLabel>Current/Preview Image</FormLabel>
                <div className="mt-2">
                  <Image 
                    src={previewImage.startsWith('data:') ? previewImage : previewImage} 
                    alt="Project image preview" 
                    width={200} 
                    height={150} 
                    className="rounded-md object-cover border"
                  />
                </div>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="imageFile"
              render={({ field: { onChange, value, ...restField }}) => ( // Destructure to avoid passing FileList to Input
                <FormItem>
                  <FormLabel>{formTypeProp === 'edit' && project?.imageUrl ? 'Replace Project Image' : 'Project Image'}</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      onChange={(e) => {
                        onChange(e.target.files); // Pass FileList to RHF
                        if (e.target.files && e.target.files[0]) {
                           if (e.target.files[0].size > MAX_FILE_SIZE_BYTES) {
                               form.setError("imageFile", { type: "manual", message: `Max image size is ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB.`});
                               setPreviewImage(project?.imageUrl || null); // Revert to old if new is too large
                               return;
                           }
                           if (!ACCEPTED_IMAGE_TYPES.includes(e.target.files[0].type)) {
                               form.setError("imageFile", { type: "manual", message: "Invalid file type."});
                               setPreviewImage(project?.imageUrl || null); // Revert to old if type is wrong
                               return;
                           }
                           form.clearErrors("imageFile"); // Clear error if valid
                        }
                      }}
                      {...restField} 
                    />
                  </FormControl>
                  <FormDescription>
                    Max file size: {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB. Accepted types: JPG, PNG, WEBP, GIF.
                    {formTypeProp === 'edit' && project?.imageUrl ? ' Leave empty to keep the current image.' : ''}
                    {formTypeProp === 'create' ? ' Project image is required.' : ''}
                  </FormDescription>
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
              {isSubmitting ? (formTypeProp === 'create' ? 'Creating...' : 'Saving...') : (formTypeProp === 'create' ? 'Create Project' : 'Save Changes')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    