
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
  console.log('[HandleImageUpload] Entered function.');
  if (!imageFile || imageFile.size === 0) {
    console.log('[HandleImageUpload] No new image file provided or file is empty. Returning existingImageUrl:', existingImageUrl);
    return existingImageUrl;
  }
  console.log(`[HandleImageUpload] New image file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`);

  if (imageFile.size > MAX_FILE_SIZE_BYTES) {
    console.error('[HandleImageUpload] Image size exceeds limit.');
    throw new Error(`Image size exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`);
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
    console.error('[HandleImageUpload] Invalid image type.');
    throw new Error(`Invalid image type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}`);
  }

  const fileExtension = path.extname(imageFile.name);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}${fileExtension}`;

  if (process.env.NODE_ENV === 'production') {
    try {
      console.log(`[HandleImageUpload] PRODUCTION: Attempting to upload projects/${filename} to Vercel Blob.`);
      const blob = await put(`projects/${filename}`, imageFile, {
        access: 'public',
        // Optionally, add cacheControl for production images if needed
        // cacheControlMaxAge: 365 * 24 * 60 * 60, // 1 year
      });
      console.log('[HandleImageUpload] PRODUCTION: Uploaded to Vercel Blob:', blob.url);
      return blob.url;
    } catch (error: unknown) {
      console.error('[HandleImageUpload] PRODUCTION: Vercel Blob upload failed:', error);
      if (error instanceof Error) {
        throw new Error(`Image upload to cloud storage failed: ${error.message}`);
      }
      throw new Error('Image upload to cloud storage failed due to an unknown error.');
    }
  } else {
    console.log('[HandleImageUpload] DEVELOPMENT: Attempting local upload.');
    const uploadDir = path.join(process.cwd(), 'public/uploads/projects');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.error(`[HandleImageUpload] DEVELOPMENT: Failed to create directory ${uploadDir}:`, mkdirError);
      throw new Error(`Failed to create upload directory: ${(mkdirError as Error).message}`);
    }
    const filePath = path.join(uploadDir, filename);

    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(filePath, buffer);
      const localUrl = `/uploads/projects/${filename}`;
      console.log('[HandleImageUpload] DEVELOPMENT: Uploaded locally to:', localUrl);
      return localUrl;
    } catch (writeError) {
      console.error(`[HandleImageUpload] DEVELOPMENT: Failed to write file ${filePath}:`, writeError);
      throw new Error(`Failed to write image file locally: ${(writeError as Error).message}`);
    }
  }
}

export async function createProject(formData: FormData): Promise<ProjectActionResponse> {
  console.log('[CreateProjectAction] Entered function.');
  try {
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
      if (key === 'imageFile' && value instanceof File && value.size > 0) {
        rawData[key] = value;
      } else if (key !== 'imageFile') {
        rawData[key] = value;
      }
    });

    let imageUrlToStore: string | null = null;
    const imageFile = rawData.imageFile as File | null;

    // --- TEMPORARY DEBUGGING BYPASS FOR IMAGE UPLOAD ---
    // Ensure this bypass logic is what you intend for debugging
    if (imageFile && imageFile.size > 0) {
        // For actual upload, call handleImageUpload:
        // imageUrlToStore = await handleImageUpload(imageFile, null);
        // console.log('[CreateProjectAction] Actual image upload processed.');
        
        // Current bypass:
        imageUrlToStore = `/temp-debug-uploads/projects/${Date.now()}-${imageFile.name}`; // Placeholder
        console.warn(`[CreateProjectAction] DEBUG: Image upload bypassed. Using placeholder: ${imageUrlToStore}`);
    } else {
        // If image is required for creation and not provided or empty
        console.error('[CreateProjectAction] Image file validation: FAILED - Missing or empty image for create.');
        return {
            success: false,
            message: 'Project image is required for creation.',
            errors: { imageFile: ['Project image is required.'] },
        };
    }
    // --- END TEMPORARY DEBUGGING BYPASS ---
    
    // If, after bypass or actual upload, imageUrlToStore is still null (and it's required)
    // This check might be redundant if the bypass logic above handles it, but for safety:
    if (!imageUrlToStore) {
         console.error('[CreateProjectAction] Image URL to store is null after image handling stage.');
        return { success: false, message: 'Image processing failed or image was not provided.', errors: { imageFile: ['Image processing failed or image was not provided.']}};
    }
    console.log(`[CreateProjectAction] Image URL to store set to: ${imageUrlToStore}`);


    const textDataToValidate = { ...rawData };
    delete textDataToValidate.imageFile;
    if (textDataToValidate.hasOwnProperty('currentImageUrl')) {
      delete textDataToValidate.currentImageUrl;
    }


    console.log('[CreateProjectAction] Data for Zod validation:', JSON.stringify(textDataToValidate, null, 2));
    const validationResult = projectFormSchema.safeParse(textDataToValidate);

    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors;
      console.error('[CreateProjectAction] Zod validation FAILED. Errors:', JSON.stringify(zodErrors, null, 2));
      return {
        success: false,
        message: 'Invalid form data. Please check the fields and try again.',
        errors: zodErrors as ProjectActionResponse['errors'],
      };
    }
    console.log('[CreateProjectAction] Zod validation PASSED.');

    const data = validationResult.data;
    let slug = data.slug && data.slug.trim() !== '' ? data.slug : generateSlug(data.title);
    console.log(`[CreateProjectAction] Using slug: ${slug}`);

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
      urls.forEach(url => {
        try {
          new URL(url);
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
        imageUrl: imageUrlToStore, // imageUrlToStore is guaranteed non-null here
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
    revalidatePath(`/projects/${newProject.slug}`); // Public project detail page
    revalidatePath('/'); // Homepage or main projects listing
    console.log('[CreateProjectAction] Paths revalidated: /admin/projects, /projects/[slug], /');

    return {
      success: true,
      message: 'Project created successfully!',
      projectId: newProject.id,
    };

  } catch (e: unknown) {
    console.error('[CreateProjectAction] UNHANDLED EXCEPTION in createProject:', e);
    let message = 'An unexpected server error occurred during project creation.';
    let errorDetails: ProjectActionResponse['errors'] = { _form: [message] };

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      message = `Database error (Code: ${e.code}): ${e.message}`;
      if (e.code === 'P2002' && e.meta?.target) {
         const target = e.meta.target as string[];
         message = `A project with this ${target.join(', ')} already exists.`;
         if (target.includes('slug')) {
            errorDetails = { slug: [message] };
         } else {
            errorDetails = { _form: [message] };
         }
      } else {
        errorDetails = { _form: [message] };
      }
    } else if (e instanceof Error) {
      message = e.message;
      errorDetails = { _form: [message] };
    } else {
      message = `An unknown error occurred: ${String(e)}`;
      errorDetails = { _form: [message] };
    }
    
    console.error(`[CreateProjectAction] Final error response: Success=false, Message="${message}", Errors=${JSON.stringify(errorDetails)}`);
    return {
      success: false,
      message: message,
      errors: errorDetails,
    };
  }
}

export async function updateProject(id: string, formData: FormData): Promise<ProjectActionResponse> {
  console.log(`[UpdateProjectAction ID: ${id}] Entered function.`);
  try {
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
      return { success: false, message: 'Project not found.', errors: {_form: ['Project not found.']} };
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

    // --- TEMPORARY DEBUGGING BYPASS FOR IMAGE UPLOAD ---
    if (imageFile && imageFile.size > 0) {
      // For actual upload:
      // const newImageUrl = await handleImageUpload(imageFile, projectToUpdate.imageUrl);
      // console.log(`[UpdateProjectAction ID: ${id}] Actual image upload attempted for update.`);
      
      // Current bypass:
      const newImageUrl = `/temp-debug-uploads/projects/${Date.now()}-${imageFile.name}`; // Placeholder
      console.warn(`[UpdateProjectAction ID: ${id}] DEBUG: Image upload bypassed. Using placeholder: ${newImageUrl}`);

      if (newImageUrl && newImageUrl !== projectToUpdate.imageUrl) {
        if (projectToUpdate.imageUrl && !projectToUpdate.imageUrl.startsWith('/temp-debug-uploads/')) { // Don't mark temp debug images for deletion from real storage
             oldImageToDelete = projectToUpdate.imageUrl;
        }
        imageUrlToStore = newImageUrl;
        console.log(`[UpdateProjectAction ID: ${id}] New image URL set: ${imageUrlToStore}. Old image marked for deletion: ${oldImageToDelete}`);
      }
    } else {
      console.log(`[UpdateProjectAction ID: ${id}] No new image file provided, keeping existing: ${imageUrlToStore}`);
    }
    // --- END TEMPORARY DEBUGGING BYPASS ---
    
    const textDataToValidate = { ...rawData };
    delete textDataToValidate.imageFile;
    if (textDataToValidate.hasOwnProperty('currentImageUrl')) {
      delete textDataToValidate.currentImageUrl;
    }

    console.log(`[UpdateProjectAction ID: ${id}] Data for Zod validation:`, JSON.stringify(textDataToValidate, null, 2));
    const validationResult = projectFormSchema.safeParse(textDataToValidate);

    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors;
      console.error(`[UpdateProjectAction ID: ${id}] Zod validation FAILED. Errors:`, JSON.stringify(zodErrors, null, 2));
      return {
        success: false,
        message: 'Invalid form data for update. Please check the fields.',
        errors: zodErrors as ProjectActionResponse['errors'],
      };
    }
    console.log(`[UpdateProjectAction ID: ${id}] Zod validation PASSED.`);

    const data = validationResult.data;
    let slugToUse = data.slug && data.slug.trim() !== '' ? data.slug : projectToUpdate.slug;
    if (data.title !== projectToUpdate.title && (!data.slug || data.slug.trim() === '')) {
        slugToUse = generateSlug(data.title);
    }
    console.log(`[UpdateProjectAction ID: ${id}] Using slug: ${slugToUse}`);

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
      if (process.env.NODE_ENV === 'production' && oldImageToDelete.startsWith('https://')) { // Assuming Vercel Blob URL
        try {
          await del(oldImageToDelete);
          console.log(`[UpdateProjectAction ID: ${id}] Deleted old Vercel Blob image: ${oldImageToDelete}`);
        } catch (blobError: any) {
          console.error(`[UpdateProjectAction ID: ${id}] Failed to delete old Vercel Blob image ${oldImageToDelete}: ${blobError.message || blobError}`);
        }
      } else if (oldImageToDelete.startsWith('/uploads/projects/')) { // Local dev image
        const imagePath = path.join(process.cwd(), 'public', oldImageToDelete);
        try {
            await fs.unlink(imagePath);
            console.log(`[UpdateProjectAction ID: ${id}] Deleted old local image file: ${imagePath}`);
        } catch (fileError: any) {
            console.error(`[UpdateProjectAction ID: ${id}] Failed to delete old local image file ${imagePath}: ${fileError.message || fileError}`);
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
    console.error(`[UpdateProjectAction ID: ${id}] UNHANDLED EXCEPTION in updateProject:`, e);
    let message = 'An unexpected server error occurred during project update.';
    let errorDetails: ProjectActionResponse['errors'] = { _form: [message] };

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      message = `Database error (Code: ${e.code}): ${e.message}`;
      if (e.code === 'P2002' && e.meta?.target) {
         const target = e.meta.target as string[];
         message = `A project with this ${target.join(', ')} already exists.`;
         if (target.includes('slug')) {
            errorDetails = { slug: [message] };
         } else {
            errorDetails = { _form: [message] };
         }
      } else if (e.code === 'P2025') {
          message = 'Project not found for update.';
          errorDetails = { _form: [message] };
      } else {
        errorDetails = { _form: [message] };
      }
    } else if (e instanceof Error) {
      message = e.message;
      errorDetails = { _form: [message] };
    } else {
      message = `An unknown error occurred: ${String(e)}`;
      errorDetails = { _form: [message] };
    }
    
    console.error(`[UpdateProjectAction ID: ${id}] Final error response: Success=false, Message="${message}", Errors=${JSON.stringify(errorDetails)}`);
    return { success: false, message, errors: errorDetails };
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

    const imageUrlToDelete = project.imageUrl;

    await prisma.project.delete({
      where: { id },
    });
    console.log(`[DeleteProjectAction ID: ${id}] Project deleted successfully from DB.`);

    if (imageUrlToDelete) {
      console.log(`[DeleteProjectAction ID: ${id}] Project had image URL: ${imageUrlToDelete}. Attempting to delete image.`);
      // Check if it's a Vercel Blob URL (production)
      if (process.env.NODE_ENV === 'production' && imageUrlToDelete.startsWith('https://') && imageUrlToDelete.includes('.public.blob.vercel-storage.com')) {
        try {
          await del(imageUrlToDelete);
          console.log(`[DeleteProjectAction ID: ${id}] Deleted Vercel Blob image: ${imageUrlToDelete}`);
        } catch (blobError: any) {
          console.error(`[DeleteProjectAction ID: ${id}] Failed to delete Vercel Blob image ${imageUrlToDelete}: ${blobError.message || blobError}`);
          // Don't fail the whole delete operation if blob deletion fails, just log it
        }
      } else if (imageUrlToDelete.startsWith('/uploads/projects/') || imageUrlToDelete.startsWith('/temp-debug-uploads/projects/')) {
        // Handle local or temporary debug images
        const localPathSegment = imageUrlToDelete.replace('/temp-debug-uploads/', '/uploads/'); // Normalize path for debug
        const imagePath = path.join(process.cwd(), 'public', localPathSegment);
        try {
            await fs.unlink(imagePath);
            console.log(`[DeleteProjectAction ID: ${id}] Deleted local image file: ${imagePath}`);
        } catch (fileError: any) {
            // Log if file doesn't exist (e.g., it was a placeholder never written, or already deleted)
            if ((fileError as NodeJS.ErrnoException).code === 'ENOENT') {
              console.warn(`[DeleteProjectAction ID: ${id}] Local image file not found (may have been a placeholder or already deleted): ${imagePath}`);
            } else {
              console.error(`[DeleteProjectAction ID: ${id}] Failed to delete local image file ${imagePath}: ${fileError.message || fileError}`);
            }
        }
      }
    }


    revalidatePath('/admin/projects');
    revalidatePath(`/projects/${project.slug}`); // This might fail if slug was just deleted, consider conditional
    revalidatePath('/');
    console.log(`[DeleteProjectAction ID: ${id}] Paths revalidated.`);
    return { success: true, message: 'Project deleted successfully.' };
  } catch (e: unknown) {
    console.error(`[DeleteProjectAction ID: ${id}] UNHANDLED EXCEPTION in deleteProject:`, e);
     let message = 'Failed to delete project. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        message = `Database error (Code: ${e.code}): ${e.message}`;
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message };
  }
}
    

    