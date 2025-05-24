
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { projectFormSchema, type ProjectFormData } from '@/lib/validators/project-validator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export type ProjectActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof ProjectFormData, string[]>> | null;
  projectId?: string; // For returning created/updated project ID
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
        }
      }
    }

    const newProject = await prisma.project.create({
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
    
    revalidatePath('/admin/projects');
    // Instead of immediate redirect, return success and projectId for toast on client
    return {
      success: true,
      message: 'Project created successfully!',
      errors: null,
      projectId: newProject.id,
    };

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
}

export async function updateProject(id: string, formData: ProjectFormData): Promise<ProjectActionResponse> {
  const validationResult = projectFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data for update.',
      errors: validationResult.error.flatten().fieldErrors as Partial<Record<keyof ProjectFormData, string[]>>,
    };
  }

  const data = validationResult.data;
  let slugToUse = data.slug;

  try {
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return { success: false, message: 'Project not found.', errors: null };
    }

    if (!slugToUse || slugToUse.trim() === '') {
      slugToUse = existingProject.slug; // Keep original slug if new one is empty
      if (data.title !== existingProject.title) { // If title changed and slug is empty, generate new slug from title
        slugToUse = generateSlug(data.title);
      }
    }
    
    // If slug has changed, check for uniqueness
    if (slugToUse !== existingProject.slug) {
      const projectWithNewSlug = await prisma.project.findFirst({
        where: { slug: slugToUse, NOT: { id } },
      });
      if (projectWithNewSlug) {
        return {
          success: false,
          message: 'Another project with this slug already exists.',
          errors: { slug: ['Slug already exists.'] },
        };
      }
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
        }
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        slug: slugToUse,
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

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/edit/${id}`);
    revalidatePath(`/projects/${updatedProject.slug}`); // Revalidate public page too

    return {
      success: true,
      message: 'Project updated successfully!',
      errors: null,
      projectId: updatedProject.id,
    };

  } catch (e: unknown) {
    console.error('Failed to update project:', e);
    let message = 'Failed to update project. Please try again.';
    let errors: Partial<Record<keyof ProjectFormData, string[]>> | null = null;
     if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         // This should be caught by the explicit slug check above, but as a fallback:
         const target = (e.meta?.target as string[]) || [];
         if (target.includes('slug')) {
            message = 'A project with this slug already exists.';
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
    return { success: false, message, errors };
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const project = await prisma.project.findUnique({ where: {id}});
    if (!project) {
      return { success: false, message: "Project not found." };
    }

    await prisma.project.delete({
      where: { id },
    });
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${project.slug}`); // Revalidate public page
    return { success: true, message: 'Project deleted successfully.' };
  } catch (e: unknown) {
    console.error('Failed to delete project:', e);
    let message = 'Failed to delete project. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // e.g. P2025 Record to delete does not exist.
        message = `Database error: ${e.message}`;
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message };
  }
}
