
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
  const validationResult = experienceFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors as Partial<Record<keyof ExperienceFormData, string[]>>,
    };
  }

  const data = validationResult.data;
  const tagsArray = data.tags ? data.tags.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  
  try {
    // Check for uniqueness based on title and date (as per schema)
    const existingEntry = await prisma.experience.findUnique({
        where: { title_date: { title: data.title, date: data.date } }
    });
    if (existingEntry) {
        return {
            success: false,
            message: 'An experience entry with this title and date already exists.',
            errors: { title: ['Entry with this title and date already exists.'], date: ['Entry with this title and date already exists.'] }
        };
    }

    const newExperience = await prisma.experience.create({
      data: {
        title: data.title,
        company: data.company || null,
        date: data.date,
        description: data.description,
        tags: tagsArray,
      },
    });
    
    revalidatePath('/admin/experience');
    return {
      success: true,
      message: 'Experience entry created successfully!',
      errors: null,
      experienceId: newExperience.id,
    };

  } catch (e: unknown) {
    console.error('Failed to create experience entry:', e);
    let message = 'Failed to create experience entry. Please try again.';
     if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') { // Unique constraint failed
             message = 'An experience entry with this title and date already exists.';
        } else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    return {
      success: false,
      message: message,
      errors: null,
    };
  }
}

export async function updateExperience(id: string, formData: ExperienceFormData): Promise<ExperienceActionResponse> {
  const validationResult = experienceFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data for update.',
      errors: validationResult.error.flatten().fieldErrors as Partial<Record<keyof ExperienceFormData, string[]>>,
    };
  }
  
  const data = validationResult.data;
  const tagsArray = data.tags ? data.tags.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

  try {
    const existingById = await prisma.experience.findUnique({ where: {id} });
    if (!existingById) {
        return { success: false, message: "Experience entry not found.", errors: null };
    }

    // Check for uniqueness if title or date changed
    if (existingById.title !== data.title || existingById.date !== data.date) {
        const conflictingEntry = await prisma.experience.findFirst({
            where: { 
                title: data.title, 
                date: data.date,
                NOT: { id } // Exclude the current entry from the check
            }
        });
        if (conflictingEntry) {
            return {
                success: false,
                message: 'Another experience entry with this title and date already exists.',
                errors: { title: ['Entry with this title and date already exists.'], date: ['Entry with this title and date already exists.'] }
            };
        }
    }
    
    const updatedExperience = await prisma.experience.update({
      where: { id },
      data: {
        title: data.title,
        company: data.company || null,
        date: data.date,
        description: data.description,
        tags: tagsArray,
      },
    });

    revalidatePath('/admin/experience');
    revalidatePath(`/admin/experience/edit/${id}`);
    
    return {
      success: true,
      message: 'Experience entry updated successfully!',
      errors: null,
      experienceId: updatedExperience.id,
    };

  } catch (e: unknown) {
    console.error('Failed to update experience entry:', e);
    let message = 'Failed to update experience entry. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
             message = 'An experience entry with this title and date already exists.';
        } else if (e.code === 'P2025') {
            message = 'Experience entry not found for update.';
        }
         else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message, errors: null };
  }
}

export async function deleteExperience(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.experience.delete({
      where: { id },
    });
    revalidatePath('/admin/experience');
    return { success: true, message: 'Experience entry deleted successfully.' };
  } catch (e: unknown)
 {
    console.error('Failed to delete experience entry:', e);
    let message = 'Failed to delete experience entry. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') { // Record to delete does not exist
            message = 'Experience entry not found.';
        } else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message };
  }
}
