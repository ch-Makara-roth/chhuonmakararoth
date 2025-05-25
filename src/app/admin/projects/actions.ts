
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { projectFormSchema, type ProjectProcessedFormData, MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES } from '@/lib/validators/project-validator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';
import { put, del } from '@vercel/blob';

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
    return existingImageUrl;
  }

  if (imageFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image size exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`);
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
    throw new Error(`Invalid image type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}`);
  }

  const fileExtension = path.extname(imageFile.name);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}${fileExtension}`;

  if (process.env.NODE_ENV === 'production') {
    try {
      console.log(`[HandleImageUpload] Attempting to upload projects/${filename} to Vercel Blob.`);
      const blob = await put(`projects/${filename}`, imageFile, {
        access: 'public',
      });
      console.log('[HandleImageUpload] Uploaded to Vercel Blob:', blob.url);
      return blob.url;
    } catch (error: unknown) {
      console.error('[HandleImageUpload] Vercel Blob upload failed:', error);
      if (error instanceof Error) {
        throw new Error(`Image upload to cloud storage failed: ${error.message}`);
      }
      throw new Error('Image upload to cloud storage failed due to an unknown error.');
    }
  } else {
    const uploadDir = path.join(process.cwd(), 'public/uploads/projects');
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log('[HandleImageUpload] Uploaded locally to:', `/uploads/projects/${filename}`);
    return `/uploads/projects/${filename}`;
  }
}

export async function createProject(formData: FormData): Promise<ProjectActionResponse> {
  console.log('[CreateProjectAction] Received FormData. Keys:', Array.from(formData.keys()));
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      console.log(`[CreateProjectAction] FormData field - ${key}: "${value}"`);
    } else if (value instanceof File) {
      console.log(`[CreateProjectAction] FormData file - ${key}: name=${value.name}, size=${value.size}, type=${value.type}`);
    }
  });

  const rawData: Record<string, any> = {};
  formData.forEach((value, key) => {
    // imageFile is handled separately if it's a File
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
      console.error('[CreateProjectAction] Image file validation: FAILED - Missing or empty.');
      return {
        success: false,
        message: 'Project image is required for creation.',
        errors: { imageFile: ['Project image is required.'] },
      };
    }
    console.log('[CreateProjectAction] Image file validation: PASSED.');
    
    // --- TEMPORARY DEBUGGING BYPASS FOR IMAGE UPLOAD ---
    // imageUrlToStore = await handleImageUpload(imageFile, null); 
    // console.log('[CreateProjectAction] Actual image upload attempted.');
    imageUrlToStore = `/temp-debug-uploads/projects/${Date.now()}-${imageFile.name}`; // Placeholder
    console.warn(`[CreateProjectAction] DEBUG: Image upload bypassed. Using placeholder: ${imageUrlToStore}`);
    // --- END TEMPORARY DEBUGGING BYPASS ---

    if (!imageUrlToStore) {
         console.error('[CreateProjectAction] Image URL to store is null after handleImageUpload.');
        return { success: false, message: 'Image upload failed or image was not provided.', errors: { imageFile: ['Image upload failed or image was not provided.']}};
    }
     console.log(`[CreateProjectAction] Image URL to store set to: ${imageUrlToStore}`);

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Image processing failed during create.';
    console.error('[CreateProjectAction] Error during image processing stage:', message, e);
    return { success: false, message, errors: { imageFile: [message], _form: [message] } };
  }

  const textDataToValidate = { ...rawData };
  delete textDataToValidate.imageFile;
  if (textDataToValidate.hasOwnProperty('currentImageUrl')) { // Ensure currentImageUrl is removed if present
    delete textDataToValidate.currentImageUrl;
  }


  console.log('[CreateProjectAction] Data for Zod validation:', JSON.stringify(textDataToValidate, null, 2));
  const validationResult = projectFormSchema.safeParse(textDataToValidate);

  if (!validationResult.success) {
    console.error('[CreateProjectAction] Zod validation FAILED. Errors:', JSON.stringify(validationResult.error.flatten().fieldErrors, null, 2));
    return {
      success: false,
      message: 'Invalid form data. Please check the fields and try again.',
      errors: validationResult.error.flatten().fieldErrors as ProjectActionResponse['errors'],
    };
  }
  console.log('[CreateProjectAction] Zod validation PASSED.');

  const data = validationResult.data;
  let slug = data.slug && data.slug.trim() !== '' ? data.slug : generateSlug(data.title);
  console.log(`[CreateProjectAction] Using slug: ${slug}`);

  try {
    const existingProjectBySlug = await prisma.project.findUnique({ where: { slug } });
    if (existingProjectBySlug) {
      console.error(`[CreateProjectAction] Slug conflict: "${slug}" already exists.`);
      return {
        success: false,
        message: 'A project with this slug already exists. Please choose a unique slug or leave it empty to auto-generate.',
        errors: { slug: ['Slug already exists.'] },
      };
    }

    const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    const featuresArray = data.featuresString ? data.featuresString.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    let detailsImagesArray: string[] = [];
    if (data.detailsImagesString) {
      const urls = data.detailsImagesString.split(',').map(s => s.trim()).filter(s => s.length > 0);
      // Simple URL validation (can be enhanced with Zod within projectFormSchema if needed)
      urls.forEach(url => {
        try {
          new URL(url); // Check if it's a valid URL structure
          detailsImagesArray.push(url);
        } catch (_) {
          console.warn(`[CreateProjectAction] Invalid URL in detailsImagesString skipped: ${url}`);
        }
      });
    }
    
    console.log('[CreateProjectAction] Preparing to create project in DB...');
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
    console.log('[CreateProjectAction] Project created successfully in DB. ID:', newProject.id);

    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${newProject.slug}`);
    revalidatePath('/');
    console.log('[CreateProjectAction] Paths revalidated: /admin/projects, /projects/[slug], /');

    return {
      success: true,
      message: 'Project created successfully!',
      projectId: newProject.id,
    };

  } catch (e: unknown) {
    console.error('[CreateProjectAction] Error during DB operation or final stage:', e);
     if (e instanceof Error) {
        console.error(`[CreateProjectAction] Error details: name=${e.name}, message=${e.message}, stack=${e.stack}`);
    } else {
        console.error('[CreateProjectAction] Unknown error structure:', e);
    }

    let message = 'Failed to create project due to a server error. Please try again.';
    let errors: ProjectActionResponse['errors'] = { _form: ['An unexpected error occurred during database operation.'] };

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         const target = (e.meta?.target as string[]) || [];
         message = `A unique constraint violation occurred on field(s): ${target.join(', ')}.`;
         if (target.includes('slug')) {
            errors = { slug: ['A project with this slug already exists.'] };
         } else {
            errors = { _form: [message] };
         }
      } else {
        message = `Database error: ${e.message} (Code: ${e.code})`;
        errors = { _form: [message] };
      }
    } else if (e instanceof Error) {
      message = e.message;
      errors = { _form: [message] };
    }
    
    return { success: false, message: message, errors: errors };
  }
}

export async function updateProject(id: string, formData: FormData): Promise<ProjectActionResponse> {
  console.log(`[UpdateProjectAction ID: ${id}] Received FormData. Keys:`, Array.from(formData.keys()));
   formData.forEach((value, key) => {
    if (typeof value === 'string') {
      console.log(`[UpdateProjectAction ID: ${id}] FormData field - ${key}: "${value}"`);
    } else if (value instanceof File) {
      console.log(`[UpdateProjectAction ID: ${id}] FormData file - ${key}: name=${value.name}, size=${value.size}, type=${value.type}`);
    }
  });

  const projectToUpdate = await prisma.project.findUnique({ where: { id } });
  if (!projectToUpdate) {
    console.error(`[UpdateProjectAction ID: ${id}] Project not found for update.`);
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
      console.log(`[UpdateProjectAction ID: ${id}] New image file provided. Attempting upload.`);
      // --- TEMPORARY DEBUGGING BYPASS FOR IMAGE UPLOAD ---
      // const newImageUrl = await handleImageUpload(imageFile, projectToUpdate.imageUrl);
      // console.log(`[UpdateProjectAction ID: ${id}] Actual image upload attempted for update.`);
      const newImageUrl = `/temp-debug-uploads/projects/${Date.now()}-${imageFile.name}`; // Placeholder
      console.warn(`[UpdateProjectAction ID: ${id}] DEBUG: Image upload bypassed. Using placeholder: ${newImageUrl}`);
      // --- END TEMPORARY DEBUGGING BYPASS ---

      if (newImageUrl && newImageUrl !== projectToUpdate.imageUrl) {
        oldImageToDelete = projectToUpdate.imageUrl;
        imageUrlToStore = newImageUrl;
         console.log(`[UpdateProjectAction ID: ${id}] New image URL set: ${imageUrlToStore}. Old image marked for deletion: ${oldImageToDelete}`);
      }
    } else {
      console.log(`[UpdateProjectAction ID: ${id}] No new image file provided, keeping existing: ${imageUrlToStore}`);
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Image processing failed during update.';
    console.error(`[UpdateProjectAction ID: ${id}] Error during image processing stage:`, message, e);
    return { success: false, message, errors: { imageFile: [message], _form: [message] } };
  }

  const textDataToValidate = { ...rawData };
  delete textDataToValidate.imageFile;
  if (textDataToValidate.hasOwnProperty('currentImageUrl')) {
    delete textDataToValidate.currentImageUrl;
  }

  console.log(`[UpdateProjectAction ID: ${id}] Data for Zod validation:`, JSON.stringify(textDataToValidate, null, 2));
  const validationResult = projectFormSchema.safeParse(textDataToValidate);

  if (!validationResult.success) {
    console.error(`[UpdateProjectAction ID: ${id}] Zod validation FAILED. Errors:`, JSON.stringify(validationResult.error.flatten().fieldErrors, null, 2));
    return {
      success: false,
      message: 'Invalid form data for update. Please check the fields.',
      errors: validationResult.error.flatten().fieldErrors as ProjectActionResponse['errors'],
    };
  }
   console.log(`[UpdateProjectAction ID: ${id}] Zod validation PASSED.`);

  const data = validationResult.data;
  let slugToUse = data.slug && data.slug.trim() !== '' ? data.slug : projectToUpdate.slug;
  if (data.title !== projectToUpdate.title && (!data.slug || data.slug.trim() === '')) {
      slugToUse = generateSlug(data.title);
  }
  console.log(`[UpdateProjectAction ID: ${id}] Using slug: ${slugToUse}`);

  try {
    if (slugToUse !== projectToUpdate.slug) {
      const projectWithNewSlug = await prisma.project.findFirst({ where: { slug: slugToUse, NOT: { id } } });
      if (projectWithNewSlug) {
        console.error(`[UpdateProjectAction ID: ${id}] Slug conflict: "${slugToUse}" already exists for another project.`);
        return { success: false, message: 'Another project with this slug already exists.', errors: { slug: ['Slug already exists.'] } };
      }
    }

    const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    const featuresArray = data.featuresString ? data.featuresString.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    let detailsImagesArray: string[] = [];
    if (data.detailsImagesString) {
      const urls = data.detailsImagesString.split(',').map(s => s.trim()).filter(s => s.length > 0);
       urls.forEach(url => {
        try {
          new URL(url);
          detailsImagesArray.push(url);
        } catch (_) {
          console.warn(`[UpdateProjectAction ID: ${id}] Invalid URL in detailsImagesString skipped: ${url}`);
        }
      });
    }
    
    console.log(`[UpdateProjectAction ID: ${id}] Preparing to update project in DB...`);
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
     console.log(`[UpdateProjectAction ID: ${id}] Project updated successfully in DB.`);

    if (oldImageToDelete) {
      console.log(`[UpdateProjectAction ID: ${id}] Attempting to delete old image: ${oldImageToDelete}`);
      if (process.env.NODE_ENV === 'production' && oldImageToDelete.startsWith('https://')) {
        try {
          await del(oldImageToDelete);
          console.log(`[UpdateProjectAction ID: ${id}] Deleted old Vercel Blob image: ${oldImageToDelete}`);
        } catch (blobError: any) {
          console.error(`[UpdateProjectAction ID: ${id}] Failed to delete old Vercel Blob image ${oldImageToDelete}: ${blobError.message}`);
        }
      } else if (oldImageToDelete.startsWith('/uploads/projects/') || oldImageToDelete.startsWith('/temp-debug-uploads/projects/')) {
        const imagePath = path.join(process.cwd(), 'public', oldImageToDelete.replace('/temp-debug-uploads/', '/uploads/')); // Adjust for debug path
        try {
            await fs.unlink(imagePath);
            console.log(`[UpdateProjectAction ID: ${id}] Deleted old local image file: ${imagePath}`);
        } catch (fileError: any) {
            console.error(`[UpdateProjectAction ID: ${id}] Failed to delete old local image file ${imagePath}: ${fileError.message}`);
        }
      }
    }

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/edit/${id}`);
    revalidatePath(`/projects/${updatedProject.slug}`);
    revalidatePath('/');
    console.log(`[UpdateProjectAction ID: ${id}] Paths revalidated.`);

    return {
      success: true,
      message: 'Project updated successfully!',
      projectId: updatedProject.id,
    };

  } catch (e: unknown) {
    console.error(`[UpdateProjectAction ID: ${id}] Error during DB operation or final stage:`, e);
    if (e instanceof Error) {
        console.error(`[UpdateProjectAction ID: ${id}] Error details: name=${e.name}, message=${e.message}, stack=${e.stack}`);
    } else {
        console.error(`[UpdateProjectAction ID: ${id}] Unknown error structure:`, e);
    }

    let message = 'Failed to update project due to a server error. Please try again.';
    let errors: ProjectActionResponse['errors'] = { _form: ['An unexpected error occurred during database operation.'] };

     if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         const target = (e.meta?.target as string[]) || [];
         message = `A unique constraint violation occurred on field(s): ${target.join(', ')}.`;
         if (target.includes('slug')) {
            errors = { slug: ['A project with this slug already exists.'] };
         } else {
            errors = { _form: [message] };
         }
      } else {
        message = `Database error: ${e.message} (Code: ${e.code})`;
        errors = { _form: [message] };
      }
    } else if (e instanceof Error) {
      message = e.message;
      errors = { _form: [message] };
    }
    return { success: false, message, errors };
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  console.log(`[DeleteProjectAction ID: ${id}] Attempting to delete project.`);
  try {
    const project = await prisma.project.findUnique({ where: {id}});
    if (!project) {
      console.error(`[DeleteProjectAction ID: ${id}] Project not found.`);
      return { success: false, message: "Project not found." };
    }

    if (project.imageUrl) {
      console.log(`[DeleteProjectAction ID: ${id}] Project has image URL: ${project.imageUrl}. Attempting to delete image.`);
      if (process.env.NODE_ENV === 'production' && project.imageUrl.startsWith('https://')) {
        try {
          await del(project.imageUrl);
          console.log(`[DeleteProjectAction ID: ${id}] Deleted Vercel Blob image: ${project.imageUrl}`);
        } catch (blobError: any) {
          console.error(`[DeleteProjectAction ID: ${id}] Failed to delete Vercel Blob image ${project.imageUrl}: ${blobError.message}`);
        }
      } else if (project.imageUrl.startsWith('/uploads/projects/') || project.imageUrl.startsWith('/temp-debug-uploads/projects/')) {
         // Adjust path for debug uploads if necessary
        const localPathSegment = project.imageUrl.replace('/temp-debug-uploads/', '/uploads/');
        const imagePath = path.join(process.cwd(), 'public', localPathSegment);
        try {
            await fs.unlink(imagePath);
            console.log(`[DeleteProjectAction ID: ${id}] Deleted local image file: ${imagePath}`);
        } catch (fileError: any) {
            console.warn(`[DeleteProjectAction ID: ${id}] Failed to delete local image file ${imagePath} (may not exist if placeholder was used): ${fileError.message}`);
        }
      }
    }

    await prisma.project.delete({
      where: { id },
    });
    console.log(`[DeleteProjectAction ID: ${id}] Project deleted successfully from DB.`);

    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${project.slug}`); // This might fail if slug was just deleted, consider conditional
    revalidatePath('/');
    console.log(`[DeleteProjectAction ID: ${id}] Paths revalidated.`);
    return { success: true, message: 'Project deleted successfully.' };
  } catch (e: unknown) {
    console.error(`[DeleteProjectAction ID: ${id}] Error during delete operation:`, e);
     if (e instanceof Error) {
        console.error(`[DeleteProjectAction ID: ${id}] Error details: name=${e.name}, message=${e.message}, stack=${e.stack}`);
    } else {
        console.error(`[DeleteProjectAction ID: ${id}] Unknown error structure:`, e);
    }

    let message = 'Failed to delete project. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        message = `Database error: ${e.message} (Code: ${e.code})`;
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message };
  }
}
    