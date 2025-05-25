
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { projectFormSchema, type ProjectProcessedFormData, MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES } from '@/lib/validators/project-validator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';

export type ProjectActionResponse = {
  success: boolean;
  message: string;
  errors?: Partial<Record<keyof ProjectProcessedFormData | "imageFile" | "_form", string[]>> | null;
  projectId?: string;
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
}

async function handleImageUpload(imageFile: File | null, existingImageUrl?: string | null): Promise<string | null | undefined> {
  if (!imageFile || imageFile.size === 0) {
    return existingImageUrl; // Keep existing or undefined if creating and no file
  }

  if (process.env.NODE_ENV === 'production') {
    // In production, don't attempt to write to local filesystem.
    // This is where integration with Vercel Blob, S3, Cloudinary, etc., would go.
    // For now, we throw an error to indicate this feature needs a cloud storage solution.
    console.warn('Image upload attempt in production without cloud storage configured. This operation will fail.');
    throw new Error('Image uploads to the local filesystem are not supported in the production environment. Please configure a cloud storage solution.');
  }

  // Local development file upload logic
  if (imageFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image size exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`);
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
    throw new Error(`Invalid image type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}`);
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads/projects');
  await fs.mkdir(uploadDir, { recursive: true });

  const fileExtension = path.extname(imageFile.name);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}${fileExtension}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/projects/${filename}`; // Relative path for DB
}

export async function createProject(formData: FormData): Promise<ProjectActionResponse> {
  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key === 'imageFile' && value instanceof File && value.size > 0) {
      rawData[key] = value;
    } else if (key !== 'imageFile') { 
      rawData[key] = value;
    }
  });

  let imageUrlToStore: string | null = null;
  const imageFile = rawData.imageFile as File | null;

  try {
    if (!imageFile || imageFile.size === 0) {
        return { success: false, message: 'Project image is required for creation.', errors: { imageFile: ['Project image is required.']}};
    }
    // The handleImageUpload function will throw in production if an image is attempted
    imageUrlToStore = await handleImageUpload(imageFile, null); 
    if (!imageUrlToStore && process.env.NODE_ENV !== 'production') { 
        // This case should ideally not be hit if image is required and upload fails locally
        return { success: false, message: 'Image upload failed.', errors: { imageFile: ['Image upload failed or image was not provided.']}};
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Image processing failed.';
    return { success: false, message, errors: { imageFile: [message], _form: [message] } };
  }
  
  const textDataToValidate = { ...rawData };
  delete textDataToValidate.imageFile; 

  const validationResult = projectFormSchema.safeParse(textDataToValidate);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors as ProjectActionResponse['errors'],
    };
  }

  const data = validationResult.data;
  let slug = data.slug && data.slug.trim() !== '' ? data.slug : generateSlug(data.title);
  
  try {
    const existingProjectBySlug = await prisma.project.findUnique({ where: { slug } });
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
        if (parsedUrl.success) { detailsImagesArray.push(parsedUrl.data); }
      }
    }

    const newProject = await prisma.project.create({
      data: {
        title: data.title,
        slug: slug,
        shortDescription: data.shortDescription,
        description: data.description,
        imageUrl: imageUrlToStore,
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
    revalidatePath(`/projects/${newProject.slug}`); // Revalidate public page
    return {
      success: true,
      message: 'Project created successfully!',
      projectId: newProject.id,
    };

  } catch (e: unknown) {
    console.error('Failed to create project:', e);
    let message = 'Failed to create project. Please try again.';
    let errors: ProjectActionResponse['errors'] = { _form: [] };

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         const target = (e.meta?.target as string[]) || [];
         if (target.includes('slug')) {
            message = 'A project with this slug already exists.';
            errors = { slug: ['Slug already exists.'] };
         } else {
            message = `A unique constraint violation occurred on field(s): ${target.join(', ')}.`;
            if (errors._form) errors._form.push(message); else errors._form = [message];
         }
      } else { 
        message = `Database error: ${e.message}`; 
        if (errors._form) errors._form.push(message); else errors._form = [message];
      }
    } else if (e instanceof Error) { 
      message = e.message; 
      if (errors._form) errors._form.push(message); else errors._form = [message];
    }
    
    return { success: false, message: message, errors: errors };
  }
}

export async function updateProject(id: string, formData: FormData): Promise<ProjectActionResponse> {
  const projectToUpdate = await prisma.project.findUnique({ where: { id } });
  if (!projectToUpdate) {
    return { success: false, message: 'Project not found.', errors: null };
  }

  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (key === 'imageFile' && value instanceof File && value.size > 0) {
      rawData[key] = value;
    } else if (key !== 'imageFile') {
      rawData[key] = value;
    }
  });

  let imageUrlToStore = projectToUpdate.imageUrl; 
  const imageFile = rawData.imageFile as File | null;
  let oldImageToDelete: string | null = null;

  try {
    if (imageFile && imageFile.size > 0) {
      // The handleImageUpload function will throw in production if an image is attempted
      const newImageUrl = await handleImageUpload(imageFile, projectToUpdate.imageUrl);
      if (newImageUrl && newImageUrl !== projectToUpdate.imageUrl) {
        oldImageToDelete = projectToUpdate.imageUrl; // Mark old image for deletion if new one is different
        imageUrlToStore = newImageUrl;
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Image processing failed.';
    return { success: false, message, errors: { imageFile: [message], _form: [message] } };
  }
  
  const textDataToValidate = { ...rawData };
  delete textDataToValidate.imageFile;

  const validationResult = projectFormSchema.safeParse(textDataToValidate);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data for update.',
      errors: validationResult.error.flatten().fieldErrors as ProjectActionResponse['errors'],
    };
  }

  const data = validationResult.data;
  let slugToUse = data.slug && data.slug.trim() !== '' ? data.slug : projectToUpdate.slug;
  if (data.title !== projectToUpdate.title && (!data.slug || data.slug.trim() === '')) {
      slugToUse = generateSlug(data.title);
  }
  
  try {
    if (slugToUse !== projectToUpdate.slug) {
      const projectWithNewSlug = await prisma.project.findFirst({ where: { slug: slugToUse, NOT: { id } } });
      if (projectWithNewSlug) {
        return { success: false, message: 'Another project with this slug already exists.', errors: { slug: ['Slug already exists.'] } };
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
        if (parsedUrl.success) { detailsImagesArray.push(parsedUrl.data); }
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        slug: slugToUse,
        shortDescription: data.shortDescription,
        description: data.description,
        imageUrl: imageUrlToStore,
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

    // Attempt to delete the old image file if a new one was uploaded
    if (oldImageToDelete && oldImageToDelete.startsWith('/uploads/projects/') && process.env.NODE_ENV !== 'production') {
        const imagePath = path.join(process.cwd(), 'public', oldImageToDelete);
        try {
            await fs.unlink(imagePath);
            console.log(`Deleted old image file: ${imagePath}`);
        } catch (fileError: any) {
            console.error(`Failed to delete old image file ${imagePath}: ${fileError.message}`);
        }
    }


    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/edit/${id}`);
    revalidatePath(`/projects/${updatedProject.slug}`); // Revalidate public page
    revalidatePath(`/`); // Revalidate home page if projects are listed there

    return {
      success: true,
      message: 'Project updated successfully!',
      projectId: updatedProject.id,
    };

  } catch (e: unknown) {
    console.error('Failed to update project:', e);
    let message = 'Failed to update project. Please try again.';
    let errors: ProjectActionResponse['errors'] = { _form: [] };
     if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         const target = (e.meta?.target as string[]) || [];
         if (target.includes('slug')) {
            message = 'A project with this slug already exists.';
            errors = { slug: ['Slug already exists.'] };
         } else { 
            message = `A unique constraint violation occurred on field(s): ${target.join(', ')}.`;
            if (errors._form) errors._form.push(message); else errors._form = [message];
         }
      } else { 
        message = `Database error: ${e.message}`; 
        if (errors._form) errors._form.push(message); else errors._form = [message];
      }
    } else if (e instanceof Error) { 
      message = e.message; 
      if (errors._form) errors._form.push(message); else errors._form = [message];
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

    // Attempt to delete the image file (only in non-production environments for local uploads)
    if (project.imageUrl && project.imageUrl.startsWith('/uploads/projects/') && process.env.NODE_ENV !== 'production') {
        const imagePath = path.join(process.cwd(), 'public', project.imageUrl);
        try {
            await fs.unlink(imagePath);
            console.log(`Deleted image file: ${imagePath}`);
        } catch (fileError: any) {
            console.error(`Failed to delete image file ${imagePath}: ${fileError.message}`);
        }
    } else if (project.imageUrl && process.env.NODE_ENV === 'production') {
        console.log(`Production environment: Image file ${project.imageUrl} on cloud storage would need manual deletion or a separate cleanup process.`);
    }


    await prisma.project.delete({
      where: { id },
    });
    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${project.slug}`); // Revalidate public page
    revalidatePath(`/`); // Revalidate home page
    return { success: true, message: 'Project deleted successfully.' };
  } catch (e: unknown) {
    console.error('Failed to delete project:', e);
    let message = 'Failed to delete project. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        message = `Database error: ${e.message}`;
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message };
  }
}
