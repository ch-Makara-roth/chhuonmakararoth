
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
import { languages as i18nLanguages, defaultLocale as i18nDefaultLocale } from '@/app/i18n/settings';


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
    const errorMsg = `Image size exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`;
    console.error('[HandleImageUpload]', errorMsg);
    throw new Error(errorMsg);
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
    const errorMsg = `Invalid image type. Accepted types: ${ACCEPTED_IMAGE_TYPES.join(', ')}`;
    console.error('[HandleImageUpload]', errorMsg);
    throw new Error(errorMsg);
  }

  const fileExtension = path.extname(imageFile.name);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}${fileExtension}`;

  if (process.env.NODE_ENV === 'production') {
    try {
      console.log(`[HandleImageUpload] PRODUCTION: Attempting to upload projects/${filename} to Vercel Blob.`);
      const blob = await put(`projects/${filename}`, imageFile, {
        access: 'public',
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
      console.log(`[HandleImageUpload] DEVELOPMENT: Ensured directory exists: ${uploadDir}`);
    } catch (mkdirError) {
      console.error(`[HandleImageUpload] DEVELOPMENT: Failed to create directory ${uploadDir}:`, mkdirError);
      throw new Error(`Failed to create upload directory: ${(mkdirError as Error).message}`);
    }
    
    const filePath = path.join(uploadDir, filename);
    console.log(`[HandleImageUpload] DEVELOPMENT: Preparing to write file to: ${filePath}`);
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
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key === 'imageFile' && value instanceof File && value.size > 0) {
        console.log(`[CreateProjectAction] FormData file - ${key}: name=${value.name}, size=${value.size}, type=${value.type}`);
        rawData[key] = value;
      } else if (key !== 'imageFile') {
        console.log(`[CreateProjectAction] FormData field - ${key}: "${value}"`);
        rawData[key] = value;
      }
    });

    const imageFile = rawData.imageFile as File | null;
    let imageUrlToStore: string | null | undefined = null;

    if (!imageFile || imageFile.size === 0) {
        console.error('[CreateProjectAction] Image file validation: FAILED - Missing or empty image for create.');
        return {
            success: false,
            message: 'Project image is required for creation.',
            errors: { imageFile: ['Project image is required.'] },
        };
    }
    
    console.log('[CreateProjectAction] Attempting image upload...');
    imageUrlToStore = await handleImageUpload(imageFile, null);
    console.log('[CreateProjectAction] Image upload processed. Resulting URL:', imageUrlToStore);
    
    if (!imageUrlToStore) {
        console.error('[CreateProjectAction] Image URL to store is null after image handling stage.');
        return { success: false, message: 'Image processing failed. Please ensure an image was provided and is valid.', errors: { imageFile: ['Image processing failed or an image is required.']}};
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
    
    const projectDataToSave = {
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
    };
    console.log('[CreateProjectAction] Preparing to create project in DB with data:', projectDataToSave);
    const newProject = await prisma.project.create({ data: projectDataToSave });
    console.log('[CreateProjectAction] Project created successfully in DB. ID:', newProject.id);

    console.log('[CreateProjectAction] Attempting to revalidate paths...');
    revalidatePath('/admin/projects');
    console.log('[CreateProjectAction] Revalidated /admin/projects');
    revalidatePath(`/projects/${newProject.slug}`); 
    console.log(`[CreateProjectAction] Revalidated /projects/${newProject.slug}`);
    revalidatePath('/'); 
    console.log('[CreateProjectAction] Revalidated /');
    console.log('[CreateProjectAction] Paths revalidation calls completed.');

    return {
      success: true,
      message: 'Project created successfully!',
      projectId: newProject.id,
      errors: null,
    };

  } catch (e: unknown) {
    console.error('[CreateProjectAction] RAW EXCEPTION in createProject:', e);
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
      if (message.startsWith("Image size exceeds") || message.startsWith("Invalid image type") || message.startsWith("Image upload to cloud storage failed") || message.startsWith("Failed to create upload directory") || message.startsWith("Failed to write image file locally")) {
        errorDetails = { imageFile: [message] };
      } else {
        errorDetails = { _form: [message] };
      }
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
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key === 'imageFile' && value instanceof File && value.size > 0) {
        console.log(`[UpdateProjectAction ID: ${id}] FormData file - ${key}: name=${value.name}, size=${value.size}, type=${value.type}`);
        rawData[key] = value;
      } else if (key !== 'imageFile') {
         console.log(`[UpdateProjectAction ID: ${id}] FormData field - ${key}: "${value}"`);
        rawData[key] = value;
      }
    });

    console.log(`[UpdateProjectAction ID: ${id}] Fetching project to update...`);
    const projectToUpdate = await prisma.project.findUnique({ where: { id } });
    if (!projectToUpdate) {
      console.error(`[UpdateProjectAction ID: ${id}] Project not found for update.`);
      return { success: false, message: 'Project not found.', errors: {_form: ['Project not found.']} };
    }
    console.log(`[UpdateProjectAction ID: ${id}] Found project to update. Current imageUrl: ${projectToUpdate.imageUrl}`);

    let imageUrlToStore = projectToUpdate.imageUrl;
    const imageFile = rawData.imageFile as File | null;
    let oldImageToDelete: string | null = null;

    if (imageFile && imageFile.size > 0) {
      console.log(`[UpdateProjectAction ID: ${id}] New image file provided. Attempting image upload...`);
      const newImageUrl = await handleImageUpload(imageFile, projectToUpdate.imageUrl);
      console.log(`[UpdateProjectAction ID: ${id}] Image upload processed. Resulting URL: ${newImageUrl}`);
      
      if (newImageUrl && newImageUrl !== projectToUpdate.imageUrl) {
        if (projectToUpdate.imageUrl) { 
             oldImageToDelete = projectToUpdate.imageUrl;
        }
        imageUrlToStore = newImageUrl;
        console.log(`[UpdateProjectAction ID: ${id}] New image URL set: ${imageUrlToStore}. Old image marked for deletion: ${oldImageToDelete}`);
      } else if (newImageUrl === projectToUpdate.imageUrl) {
        console.log(`[UpdateProjectAction ID: ${id}] Uploaded image resulted in the same URL or existing URL was returned. No change to imageUrl or oldImageToDelete.`);
      } else {
        console.log(`[UpdateProjectAction ID: ${id}] No new image URL was generated by handleImageUpload, or existing image was kept. Current imageUrlToStore: ${imageUrlToStore}`);
      }
    } else {
      console.log(`[UpdateProjectAction ID: ${id}] No new image file provided, keeping existing image URL: ${imageUrlToStore}`);
    }
    
    if (!imageUrlToStore) {
        console.error(`[UpdateProjectAction ID: ${id}] Image URL is null. This might happen if no new image was provided and the project initially had no image, or if required image was removed.`);
        // If image is truly required for update, and it's now null, this should be an error.
        // Assuming imageUrl is always required for a project after initial creation.
        return { success: false, message: 'Project image is required and could not be processed or was removed.', errors: { imageFile: ['Project image is required.']}};
    }


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
      console.log(`[UpdateProjectAction ID: ${id}] Slug changed. Checking for conflicts with new slug: ${slugToUse}`);
      const projectWithNewSlug = await prisma.project.findFirst({ where: { slug: slugToUse, NOT: { id } } });
      if (projectWithNewSlug) {
        console.error(`[UpdateProjectAction ID: ${id}] Slug conflict: "${slugToUse}" already exists for another project.`);
        return { success: false, message: 'Another project with this slug already exists.', errors: { slug: ['Slug already exists.'] } };
      }
      console.log(`[UpdateProjectAction ID: ${id}] New slug ${slugToUse} is unique.`);
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
    
    const projectDataToUpdate = {
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
    };
    console.log(`[UpdateProjectAction ID: ${id}] Preparing to update project in DB with data:`, JSON.stringify(projectDataToUpdate, null, 2));
    const updatedProject = await prisma.project.update({
      where: { id },
      data: projectDataToUpdate,
    });
    console.log(`[UpdateProjectAction ID: ${id}] Project updated successfully in DB.`);

    if (oldImageToDelete) {
      console.log(`[UpdateProjectAction ID: ${id}] Attempting to delete old image: ${oldImageToDelete}`);
      if (process.env.NODE_ENV === 'production' && oldImageToDelete.startsWith('https://') && oldImageToDelete.includes('.public.blob.vercel-storage.com')) {
        try {
          await del(oldImageToDelete);
          console.log(`[UpdateProjectAction ID: ${id}] Deleted old Vercel Blob image: ${oldImageToDelete}`);
        } catch (blobError: any) {
          console.error(`[UpdateProjectAction ID: ${id}] Failed to delete old Vercel Blob image ${oldImageToDelete}: ${blobError.message || blobError}`);
        }
      } else if (process.env.NODE_ENV !== 'production' && oldImageToDelete.startsWith('/uploads/projects/')) { 
        const imagePath = path.join(process.cwd(), 'public', oldImageToDelete);
        console.log(`[UpdateProjectAction ID: ${id}] Attempting to delete old local image file: ${imagePath}`);
        try {
            await fs.unlink(imagePath);
            console.log(`[UpdateProjectAction ID: ${id}] Deleted old local image file: ${imagePath}`);
        } catch (fileError: any) {
            console.error(`[UpdateProjectAction ID: ${id}] Failed to delete old local image file ${imagePath}: ${fileError.message || fileError}`);
        }
      }
    }

    console.log(`[UpdateProjectAction ID: ${id}] Attempting to revalidate paths...`);
    revalidatePath('/admin/projects');
    console.log(`[UpdateProjectAction ID: ${id}] Revalidated /admin/projects`);
    revalidatePath(`/admin/projects/edit/${id}`);
    console.log(`[UpdateProjectAction ID: ${id}] Revalidated /admin/projects/edit/${id}`);
    
    // Explicitly revalidate homepage and localized versions
    revalidatePath('/');
    console.log(`[UpdateProjectAction ID: ${id}] Revalidated /`);
    for (const lang of i18nLanguages) {
      if (lang !== i18nDefaultLocale) {
        revalidatePath(`/${lang}`);
        console.log(`[UpdateProjectAction ID: ${id}] Revalidated /${lang}`);
      }
      // Revalidate project detail pages for all languages
      const baseProjectDetailPath = `/projects/${updatedProject.slug}`;
      const localizedProjectDetailPath = lang === i18nDefaultLocale ? baseProjectDetailPath : `/${lang}${baseProjectDetailPath}`;
      revalidatePath(localizedProjectDetailPath);
      console.log(`[UpdateProjectAction ID: ${id}] Revalidated ${localizedProjectDetailPath}`);

      if (projectToUpdate.slug !== updatedProject.slug) {
          const oldBaseProjectDetailPath = `/projects/${projectToUpdate.slug}`;
          const oldLocalizedProjectDetailPath = lang === i18nDefaultLocale ? oldBaseProjectDetailPath : `/${lang}${oldBaseProjectDetailPath}`;
          revalidatePath(oldLocalizedProjectDetailPath);
          console.log(`[UpdateProjectAction ID: ${id}] Revalidated old slug path ${oldLocalizedProjectDetailPath}`);
      }
    }
    
    console.log(`[UpdateProjectAction ID: ${id}] All revalidatePath calls completed at ${new Date().toISOString()}`);


    return {
      success: true,
      message: 'Project updated successfully!',
      projectId: updatedProject.id,
      errors: null,
    };

  } catch (e: unknown) {
    console.error(`[UpdateProjectAction ID: ${id}] RAW UNHANDLED EXCEPTION in updateProject:`, e);
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
      if (message.startsWith("Image size exceeds") || message.startsWith("Invalid image type") || message.startsWith("Image upload to cloud storage failed") || message.startsWith("Failed to create upload directory") || message.startsWith("Failed to write image file locally")) {
        errorDetails = { imageFile: [message] };
      } else {
        errorDetails = { _form: [message] };
      }
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
  let projectSlugForRevalidation: string | null = null;
  let imageUrlToDelete: string | null = null;
  try {
    console.log(`[DeleteProjectAction ID: ${id}] Fetching project to delete...`);
    const project = await prisma.project.findUnique({ where: {id}});
    if (!project) {
      console.error(`[DeleteProjectAction ID: ${id}] Project not found.`);
      return { success: false, message: "Project not found." };
    }
    console.log(`[DeleteProjectAction ID: ${id}] Found project to delete: ${project.title}`);
    projectSlugForRevalidation = project.slug; 
    imageUrlToDelete = project.imageUrl;

    console.log(`[DeleteProjectAction ID: ${id}] Deleting project from DB...`);
    await prisma.project.delete({ where: { id } });
    console.log(`[DeleteProjectAction ID: ${id}] Project deleted successfully from DB.`);

    if (imageUrlToDelete) {
      console.log(`[DeleteProjectAction ID: ${id}] Project had image URL: ${imageUrlToDelete}. Attempting to delete image.`);
      if (process.env.NODE_ENV === 'production' && imageUrlToDelete.startsWith('https://') && imageUrlToDelete.includes('.public.blob.vercel-storage.com')) {
        try {
          await del(imageUrlToDelete);
          console.log(`[DeleteProjectAction ID: ${id}] Deleted Vercel Blob image: ${imageUrlToDelete}`);
        } catch (blobError: any) {
          console.error(`[DeleteProjectAction ID: ${id}] Failed to delete Vercel Blob image ${imageUrlToDelete}: ${blobError.message || blobError}. Continuing without failing delete action.`);
        }
      } else if (process.env.NODE_ENV !== 'production' && imageUrlToDelete.startsWith('/uploads/projects/')) {
        const imagePath = path.join(process.cwd(), 'public', imageUrlToDelete);
        console.log(`[DeleteProjectAction ID: ${id}] Attempting to delete local image file: ${imagePath}`);
        try {
            await fs.unlink(imagePath);
            console.log(`[DeleteProjectAction ID: ${id}] Deleted local image file: ${imagePath}`);
        } catch (fileError: any) {
            if ((fileError as NodeJS.ErrnoException).code === 'ENOENT') {
              console.warn(`[DeleteProjectAction ID: ${id}] Local image file not found (may have been already deleted): ${imagePath}`);
            } else {
              console.error(`[DeleteProjectAction ID: ${id}] Failed to delete local image file ${imagePath}: ${fileError.message || fileError}. Continuing without failing delete action.`);
            }
        }
      }
    }

    console.log(`[DeleteProjectAction ID: ${id}] Attempting to revalidate paths...`);
    revalidatePath('/admin/projects');
    console.log(`[DeleteProjectAction ID: ${id}] Revalidated /admin/projects`);

    revalidatePath('/');
    console.log(`[DeleteProjectAction ID: ${id}] Revalidated /`);
    for (const lang of i18nLanguages) {
      if (lang !== i18nDefaultLocale) {
        revalidatePath(`/${lang}`);
        console.log(`[DeleteProjectAction ID: ${id}] Revalidated /${lang}`);
      }
      if (projectSlugForRevalidation) {
        const baseProjectDetailPath = `/projects/${projectSlugForRevalidation}`;
        const localizedProjectDetailPath = lang === i18nDefaultLocale ? baseProjectDetailPath : `/${lang}${baseProjectDetailPath}`;
        revalidatePath(localizedProjectDetailPath);
        console.log(`[DeleteProjectAction ID: ${id}] Revalidated project detail path ${localizedProjectDetailPath}`);
      }
    }
    console.log(`[DeleteProjectAction ID: ${id}] Paths revalidation calls completed at ${new Date().toISOString()}.`);

    return { success: true, message: 'Project deleted successfully.' };
  } catch (e: unknown) {
    console.error(`[DeleteProjectAction ID: ${id}] RAW UNHANDLED EXCEPTION in deleteProject:`, e);
     let message = 'Failed to delete project. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        message = `Database error (Code: ${e.code}): ${e.message}`;
        if (e.code === 'P2025') {
            message = 'Project not found for deletion.';
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    console.error(`[DeleteProjectAction ID: ${id}] Final error response: Success=false, Message="${message}"`);
    return { success: false, message };
  }
}
