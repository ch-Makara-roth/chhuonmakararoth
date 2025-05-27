
'use server';

import { revalidatePath } from 'next/cache';
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
  console.log('[CreateSkillAction] Entered function with data:', formData);
  try {
    const validationResult = skillFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors as Partial<Record<keyof SkillFormData, string[]>>;
      console.error('[CreateSkillAction] Zod validation FAILED. Errors:', JSON.stringify(zodErrors, null, 2));
      return {
        success: false,
        message: 'Invalid form data.',
        errors: zodErrors,
      };
    }
    console.log('[CreateSkillAction] Zod validation PASSED.');

    const data = validationResult.data;
    const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    console.log('[CreateSkillAction] Checking for existing skill by name...');
    const existingSkill = await prisma.skill.findUnique({
      where: { name: data.name },
    });

    if (existingSkill) {
      console.warn(`[CreateSkillAction] Skill with name "${data.name}" already exists.`);
      return {
        success: false,
        message: 'A skill with this name already exists.',
        errors: { name: ['Skill name must be unique.'] },
      };
    }

    const skillDataToSave = {
      name: data.name,
      category: data.category,
      proficiency: data.proficiency,
      technologies: technologiesArray,
    };
    console.log('[CreateSkillAction] Preparing to create skill in DB with data:', skillDataToSave);
    const newSkill = await prisma.skill.create({ data: skillDataToSave });
    console.log('[CreateSkillAction] Skill created successfully in DB. ID:', newSkill.id);
    
    revalidatePath('/admin/skills');
    revalidatePath('/'); 
    console.log('[CreateSkillAction] Paths revalidated: /admin/skills, /');
    return {
      success: true,
      message: 'Skill created successfully!',
      errors: null,
      skillId: newSkill.id,
    };

  } catch (e: unknown) {
    console.error('[CreateSkillAction] RAW EXCEPTION:', e);
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
    console.error(`[CreateSkillAction] Final error response: Success=false, Message="${message}", Errors=${JSON.stringify(errors)}`);
    return {
      success: false,
      message: message,
      errors: errors,
    };
  }
}

export async function updateSkill(id: string, formData: SkillFormData): Promise<SkillActionResponse> {
  console.log(`[UpdateSkillAction ID: ${id}] Entered function with data:`, formData);
  try {
    const validationResult = skillFormSchema.safeParse(formData);

    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors as Partial<Record<keyof SkillFormData, string[]>>;
      console.error(`[UpdateSkillAction ID: ${id}] Zod validation FAILED. Errors:`, JSON.stringify(zodErrors, null, 2));
      return {
        success: false,
        message: 'Invalid form data for update.',
        errors: zodErrors,
      };
    }
    console.log(`[UpdateSkillAction ID: ${id}] Zod validation PASSED.`);
    
    const data = validationResult.data;
    const technologiesArray = data.technologies ? data.technologies.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

    console.log(`[UpdateSkillAction ID: ${id}] Checking for existing skill by new name (if changed)...`);
    const existingSkillByName = await prisma.skill.findFirst({
        where: { name: data.name, NOT: {id} }
    });
    if (existingSkillByName) {
        console.warn(`[UpdateSkillAction ID: ${id}] Another skill with name "${data.name}" already exists.`);
        return {
            success: false,
            message: "Another skill with this name already exists.",
            errors: { name: ["Skill name must be unique."] }
        };
    }

    const skillDataToUpdate = {
      name: data.name,
      category: data.category,
      proficiency: data.proficiency,
      technologies: technologiesArray,
    };
    console.log(`[UpdateSkillAction ID: ${id}] Preparing to update skill in DB with data:`, skillDataToUpdate);
    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: skillDataToUpdate,
    });
    console.log(`[UpdateSkillAction ID: ${id}] Skill updated successfully in DB.`);

    revalidatePath('/admin/skills');
    revalidatePath(`/admin/skills/edit/${id}`);
    revalidatePath('/'); 
    console.log(`[UpdateSkillAction ID: ${id}] Paths revalidated.`);
    
    return {
      success: true,
      message: 'Skill updated successfully!',
      errors: null,
      skillId: updatedSkill.id,
    };

  } catch (e: unknown) {
    console.error(`[UpdateSkillAction ID: ${id}] RAW EXCEPTION:`, e);
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
    console.error(`[UpdateSkillAction ID: ${id}] Final error response: Success=false, Message="${message}", Errors=${JSON.stringify(errors)}`);
    return { success: false, message, errors };
  }
}

export async function deleteSkill(id: string): Promise<{ success: boolean; message: string }> {
  console.log(`[DeleteSkillAction ID: ${id}] Attempting to delete skill.`);
  try {
    console.log(`[DeleteSkillAction ID: ${id}] Deleting from DB...`);
    await prisma.skill.delete({
      where: { id },
    });
    console.log(`[DeleteSkillAction ID: ${id}] Skill deleted successfully from DB.`);
    revalidatePath('/admin/skills');
    revalidatePath('/'); 
    console.log(`[DeleteSkillAction ID: ${id}] Paths revalidated.`);
    return { success: true, message: 'Skill deleted successfully.' };
  } catch (e: unknown) {
    console.error(`[DeleteSkillAction ID: ${id}] RAW EXCEPTION:`, e);
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
    console.error(`[DeleteSkillAction ID: ${id}] Final error response: Success=false, Message="${message}"`);
    return { success: false, message };
  }
}
