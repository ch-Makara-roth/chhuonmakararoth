
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { experienceFormSchema, type ExperienceFormData } from '@/lib/validators/experience-validator';
import { Prisma } from '@prisma/client';

export type ExperienceActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof ExperienceFormData, string[]>> | null;
  experienceId?: string;
};

export async function createExperience(formData: ExperienceFormData): Promise<ExperienceActionResponse> {
  console.log('[CreateExperienceAction] Entered function with data:', formData);
  try {
    const validationResult = experienceFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors as Partial<Record<keyof ExperienceFormData, string[]>>;
      console.error('[CreateExperienceAction] Zod validation FAILED. Errors:', JSON.stringify(zodErrors, null, 2));
      return {
        success: false,
        message: 'Invalid form data.',
        errors: zodErrors,
      };
    }
    console.log('[CreateExperienceAction] Zod validation PASSED.');

    const data = validationResult.data;
    const tagsArray = data.tags ? data.tags.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    console.log('[CreateExperienceAction] Checking for existing entry by title and date...');
    const existingEntry = await prisma.experience.findUnique({
        where: { title_date: { title: data.title, date: data.date } }
    });
    if (existingEntry) {
        console.warn('[CreateExperienceAction] Entry with this title and date already exists.');
        return {
            success: false,
            message: 'An experience entry with this title and date already exists.',
            errors: { title: ['Entry with this title and date already exists.'], date: ['Entry with this title and date already exists.'] }
        };
    }

    const experienceDataToSave = {
      title: data.title,
      company: data.company || null,
      date: data.date,
      description: data.description,
      tags: tagsArray,
    };
    console.log('[CreateExperienceAction] Preparing to create experience in DB with data:', experienceDataToSave);
    const newExperience = await prisma.experience.create({ data: experienceDataToSave });
    console.log('[CreateExperienceAction] Experience entry created successfully in DB. ID:', newExperience.id);
    
    revalidatePath('/admin/experience');
    revalidatePath('/'); 
    console.log('[CreateExperienceAction] Paths revalidated: /admin/experience, /');
    return {
      success: true,
      message: 'Experience entry created successfully!',
      errors: null,
      experienceId: newExperience.id,
    };

  } catch (e: unknown) {
    console.error('[CreateExperienceAction] RAW EXCEPTION:', e);
    let message = 'Failed to create experience entry. Please try again.';
    let errors: Partial<Record<keyof ExperienceFormData, string[]>> | null = null;
     if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') { 
             message = 'An experience entry with this title and date already exists.';
             errors = { title: ['Entry with this title and date already exists.'], date: ['Entry with this title and date already exists.'] };
        } else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    console.error(`[CreateExperienceAction] Final error response: Success=false, Message="${message}", Errors=${JSON.stringify(errors)}`);
    return {
      success: false,
      message: message,
      errors: errors,
    };
  }
}

export async function updateExperience(id: string, formData: ExperienceFormData): Promise<ExperienceActionResponse> {
  console.log(`[UpdateExperienceAction ID: ${id}] Entered function with data:`, formData);
  try {
    const validationResult = experienceFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors as Partial<Record<keyof ExperienceFormData, string[]>>;
      console.error(`[UpdateExperienceAction ID: ${id}] Zod validation FAILED. Errors:`, JSON.stringify(zodErrors, null, 2));
      return {
        success: false,
        message: 'Invalid form data for update.',
        errors: zodErrors,
      };
    }
    console.log(`[UpdateExperienceAction ID: ${id}] Zod validation PASSED.`);
    
    const data = validationResult.data;
    const tagsArray = data.tags ? data.tags.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

    console.log(`[UpdateExperienceAction ID: ${id}] Fetching existing entry by ID...`);
    const existingById = await prisma.experience.findUnique({ where: {id} });
    if (!existingById) {
        console.warn(`[UpdateExperienceAction ID: ${id}] Experience entry not found.`);
        return { success: false, message: "Experience entry not found.", errors: null };
    }

    if (existingById.title !== data.title || existingById.date !== data.date) {
        console.log(`[UpdateExperienceAction ID: ${id}] Title or date changed. Checking for conflicts...`);
        const conflictingEntry = await prisma.experience.findFirst({
            where: { 
                title: data.title, 
                date: data.date,
                NOT: { id } 
            }
        });
        if (conflictingEntry) {
            console.warn(`[UpdateExperienceAction ID: ${id}] Another entry with new title/date already exists.`);
            return {
                success: false,
                message: 'Another experience entry with this title and date already exists.',
                errors: { title: ['Entry with this title and date already exists.'], date: ['Entry with this title and date already exists.'] }
            };
        }
    }
    
    const experienceDataToUpdate = {
      title: data.title,
      company: data.company || null,
      date: data.date,
      description: data.description,
      tags: tagsArray,
    };
    console.log(`[UpdateExperienceAction ID: ${id}] Preparing to update experience in DB with data:`, experienceDataToUpdate);
    const updatedExperience = await prisma.experience.update({
      where: { id },
      data: experienceDataToUpdate,
    });
    console.log(`[UpdateExperienceAction ID: ${id}] Experience entry updated successfully in DB.`);

    revalidatePath('/admin/experience');
    revalidatePath(`/admin/experience/edit/${id}`);
    revalidatePath('/'); 
    console.log(`[UpdateExperienceAction ID: ${id}] Paths revalidated.`);
    
    return {
      success: true,
      message: 'Experience entry updated successfully!',
      errors: null,
      experienceId: updatedExperience.id,
    };

  } catch (e: unknown) {
    console.error(`[UpdateExperienceAction ID: ${id}] RAW EXCEPTION:`, e);
    let message = 'Failed to update experience entry. Please try again.';
    let errors: Partial<Record<keyof ExperienceFormData, string[]>> | null = null;
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
             message = 'An experience entry with this title and date already exists.';
             errors = { title: ['Entry with this title and date already exists.'], date: ['Entry with this title and date already exists.'] };
        } else if (e.code === 'P2025') {
            message = 'Experience entry not found for update.';
        }
         else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    console.error(`[UpdateExperienceAction ID: ${id}] Final error response: Success=false, Message="${message}", Errors=${JSON.stringify(errors)}`);
    return { success: false, message, errors };
  }
}

export async function deleteExperience(id: string): Promise<{ success: boolean; message: string }> {
  console.log(`[DeleteExperienceAction ID: ${id}] Attempting to delete experience entry.`);
  try {
    console.log(`[DeleteExperienceAction ID: ${id}] Deleting from DB...`);
    await prisma.experience.delete({
      where: { id },
    });
    console.log(`[DeleteExperienceAction ID: ${id}] Experience entry deleted successfully from DB.`);
    revalidatePath('/admin/experience');
    revalidatePath('/'); 
    console.log(`[DeleteExperienceAction ID: ${id}] Paths revalidated.`);
    return { success: true, message: 'Experience entry deleted successfully.' };
  } catch (e: unknown) {
    console.error(`[DeleteExperienceAction ID: ${id}] RAW EXCEPTION:`, e);
    let message = 'Failed to delete experience entry. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') { 
            message = 'Experience entry not found.';
        } else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    console.error(`[DeleteExperienceAction ID: ${id}] Final error response: Success=false, Message="${message}"`);
    return { success: false, message };
  }
}
