
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { projectFormSchema, type ProjectFormData } from '@/lib/validators/project-validator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

type ProjectActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof ProjectFormData, string[]>> | null;
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export async function createProject(formData: ProjectFormData): Promise<ProjectActionResponse> {
  const validationResult = projectFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors as Partial<Record<keyof ProjectFormData, string[]>>,
    };
  }

  const data = validationResult.data;

  let slug = data.slug;
  if (!slug || slug.trim() === '') {
    slug = generateSlug(data.title);
  }

  // Ensure slug is unique
  try {
    const existingProjectBySlug = await prisma.project.findUnique({
      where: { slug },
    });

    if (existingProjectBySlug) {
      return {
        success: false,
        message: 'A project with this slug already exists. Please choose a unique slug or leave it empty to auto-generate.',
        errors: { slug: ['Slug already exists.'] }
      };
    }
  } catch (e: unknown) {
    console.error('Error checking for existing slug:', e);
    return {
      success: false,
      message: 'An error occurred while checking for existing slug. Please try again.',
      errors: null,
    };
  }
  
  const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  const featuresArray = data.featuresString ? data.featuresString.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  
  let detailsImagesArray: string[] = [];
  if (data.detailsImagesString) {
    const urls = data.detailsImagesString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const urlSchema = z.string().url();
    for (const url of urls) {
      const parsedUrl = urlSchema.safeParse(url);
      if (parsedUrl.success) {
        detailsImagesArray.push(parsedUrl.data);
      } else {
        // Optionally handle invalid URLs, e.g., return an error
        // For now, we'll just skip invalid ones
      }
    }
  }

  try {
    await prisma.project.create({
      data: {
        title: data.title,
        slug: slug,
        shortDescription: data.shortDescription,
        description: data.description,
        imageUrl: data.imageUrl,
        dataAiHint: data.dataAiHint || null,
        technologies: technologiesArray,
        liveLink: data.liveLink || null,
        repoLink: data.repoLink || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        detailsImages: detailsImagesArray,
        features: featuresArray,
      },
    });
  } catch (e: unknown) {
    console.error('Failed to create project:', e);
    let message = 'Failed to create project. Please try again.';
    let errors: Partial<Record<keyof ProjectFormData, string[]>> | null = null;

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         const target = (e.meta?.target as string[]) || [];
         if (target.includes('slug')) {
            message = 'A project with this slug already exists. Please choose a unique slug or leave it empty to auto-generate.';
            errors = { slug: ['Slug already exists.'] };
         } else {
            message = `A unique constraint violation occurred on field(s): ${target.join(', ')}.`;
         }
      } else {
        message = `Database error: ${e.message}`;
      }
    } else if (e instanceof Error) {
      message = e.message;
    }
    
    return {
      success: false,
      message: message,
      errors: errors,
    };
  }

  revalidatePath('/admin/projects');
  redirect('/admin/projects');

  // This part is effectively unreachable due to redirect, but good for type consistency if redirect was conditional
  // return {
  //   success: true,
  //   message: 'Project created successfully!',
  //   errors: null,
  // };
}
