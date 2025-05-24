
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { experienceFormSchema, type ExperienceFormData } from '@/lib/validators/experience-validator';

export async function createExperience(formData: ExperienceFormData) {
  const validationResult = experienceFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors,
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
  } catch (error: any) {
    console.error('Failed to create experience entry:', error);
    return {
      success: false,
      message: 'Failed to create experience entry. Please try again.',
      errors: null,
    };
  }

  revalidatePath('/admin/experience');
  redirect('/admin/experience');

  // This part is effectively unreachable due to redirect, but good for type consistency
  // return {
  //   success: true,
  //   message: 'Experience entry created successfully!',
  //   errors: null,
  // };
}
