
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { skillFormSchema, type SkillFormData } from '@/lib/validators/skill-validator';

export async function createSkill(formData: SkillFormData) {
  const validationResult = skillFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const data = validationResult.data;
  
  const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  
  try {
    // Check if skill with the same name already exists (case-insensitive check if needed)
    // For simplicity, Prisma's default check is case-sensitive for MongoDB unless an index is configured differently.
    const existingSkill = await prisma.skill.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } }, // case-insensitive check
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
  } catch (error: any) {
    console.error('Failed to create skill:', error);
    // Handle potential Prisma unique constraint errors if not caught by the check above (e.g., race conditions)
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
         return {
            success: false,
            message: 'A skill with this name already exists.',
            errors: { name: ['Skill name must be unique.'] }
        };
    }
    return {
      success: false,
      message: 'Failed to create skill. Please try again.',
      errors: null,
    };
  }

  revalidatePath('/admin/skills');
  redirect('/admin/skills');
}
