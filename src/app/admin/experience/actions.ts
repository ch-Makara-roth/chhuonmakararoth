
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { experienceFormSchema, type ExperienceFormData } from '@/lib/validators/experience-validator';
import { Prisma } from '@prisma/client';

type ExperienceActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof ExperienceFormData, string[]>> | null;
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
    await prisma.experience.create({
      data: {
        title: data.title,
        company: data.company || null,
        date: data.date,
        description: data.description,
        tags: tagsArray,
      },
    });
  } catch (e: unknown) {
    console.error('Failed to create experience entry:', e);
    let message = 'Failed to create experience entry. Please try again.';
     if (e instanceof Prisma.PrismaClientKnownRequestError) {
        message = `Database error: ${e.message}`;
    } else if (e instanceof Error) {
      message = e.message;
    }
    return {
      success: false,
      message: message,
      errors: null,
    };
  }

  revalidatePath('/admin/experience');
  redirect('/admin/experience');
}
