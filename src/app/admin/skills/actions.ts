
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { skillFormSchema, type SkillFormData } from '@/lib/validators/skill-validator';
import { Prisma } from '@prisma/client';

type SkillActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof SkillFormData, string[]>> | null;
};

export async function createSkill(formData: SkillFormData): Promise<SkillActionResponse> {
  const validationResult = skillFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors as Partial<Record<keyof SkillFormData, string[]>>,
    };
  }

  const data = validationResult.data;
  
  const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  
  try {
    const existingSkill = await prisma.skill.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });

    if (existingSkill) {
      return {
        success: false,
        message: 'A skill with this name already exists.',
        errors: { name: ['Skill name must be unique.'] },
      };
    }

    await prisma.skill.create({
      data: {
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        technologies: technologiesArray,
      },
    });
  } catch (e: unknown) {
    console.error('Failed to create skill:', e);
    let message = 'Failed to create skill. Please try again.';
    let errors: Partial<Record<keyof SkillFormData, string[]>> | null = null;

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
         const target = (e.meta?.target as string[]) || [];
         if (target.includes('name')) {
            message = 'A skill with this name already exists.';
            errors = { name: ['Skill name must be unique.'] };
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

  revalidatePath('/admin/skills');
  redirect('/admin/skills');
}
