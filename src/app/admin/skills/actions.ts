
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { skillFormSchema, type SkillFormData } from '@/lib/validators/skill-validator';
import { Prisma } from '@prisma/client';

export type SkillActionResponse = {
  success: boolean;
  message: string;
  errors: Partial<Record<keyof SkillFormData, string[]>> | null;
  skillId?: string;
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
    const existingSkill = await prisma.skill.findUnique({
      where: { name: data.name }, // Assuming name is unique as per schema
    });

    if (existingSkill) {
      return {
        success: false,
        message: 'A skill with this name already exists.',
        errors: { name: ['Skill name must be unique.'] },
      };
    }

    const newSkill = await prisma.skill.create({
      data: {
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        technologies: technologiesArray,
      },
    });
    
    revalidatePath('/admin/skills');
    return {
      success: true,
      message: 'Skill created successfully!',
      errors: null,
      skillId: newSkill.id,
    };

  } catch (e: unknown) {
    console.error('Failed to create skill:', e);
    let message = 'Failed to create skill. Please try again.';
    let errors: Partial<Record<keyof SkillFormData, string[]>> | null = null;

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') { // Unique constraint failed (e.g. on name)
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
}

export async function updateSkill(id: string, formData: SkillFormData): Promise<SkillActionResponse> {
  const validationResult = skillFormSchema.safeParse(formData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Invalid form data for update.',
      errors: validationResult.error.flatten().fieldErrors as Partial<Record<keyof SkillFormData, string[]>>,
    };
  }
  
  const data = validationResult.data;
  const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

  try {
    const existingSkillByName = await prisma.skill.findFirst({
        where: { name: data.name, NOT: {id} }
    });
    if (existingSkillByName) {
        return {
            success: false,
            message: "Another skill with this name already exists.",
            errors: { name: ["Skill name must be unique."] }
        };
    }

    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        technologies: technologiesArray,
      },
    });

    revalidatePath('/admin/skills');
    revalidatePath(`/admin/skills/edit/${id}`);
    
    return {
      success: true,
      message: 'Skill updated successfully!',
      errors: null,
      skillId: updatedSkill.id,
    };

  } catch (e: unknown) {
    console.error('Failed to update skill:', e);
    let message = 'Failed to update skill. Please try again.';
    let errors: Partial<Record<keyof SkillFormData, string[]>> | null = null;

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
             const target = (e.meta?.target as string[]) || [];
             if (target.includes('name')) {
                message = 'A skill with this name already exists.';
                errors = { name: ['Skill name must be unique.'] };
             } else {
                message = `A unique constraint violation occurred.`;
             }
        } else if (e.code === 'P2025') {
            message = 'Skill not found for update.';
        } else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message, errors };
  }
}

export async function deleteSkill(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.skill.delete({
      where: { id },
    });
    revalidatePath('/admin/skills');
    return { success: true, message: 'Skill deleted successfully.' };
  } catch (e: unknown) {
    console.error('Failed to delete skill:', e);
    let message = 'Failed to delete skill. Please try again.';
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') { 
            message = 'Skill not found.';
        } else {
            message = `Database error: ${e.message}`;
        }
    } else if (e instanceof Error) {
      message = e.message;
    }
    return { success: false, message };
  }
}
