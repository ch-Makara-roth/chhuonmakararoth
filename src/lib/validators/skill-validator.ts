
import { z } from 'zod';

export const skillFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, { message: "Name must be 100 characters or less."}),
  category: z.string().min(2, { message: "Category must be at least 2 characters." }).max(50, { message: "Category must be 50 characters or less."}),
  proficiency: z.coerce // Use coerce to convert string input from number field to number
    .number({ invalid_type_error: "Proficiency must be a number." })
    .min(0, { message: "Proficiency must be at least 0." })
    .max(100, { message: "Proficiency must be at most 100." }),
  technologies: z.string().optional().or(z.literal('')), // Comma-separated string
});

export type SkillFormData = z.infer<typeof skillFormSchema>;
