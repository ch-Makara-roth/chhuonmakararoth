
import { z } from 'zod';

export const experienceFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100, { message: "Title must be 100 characters or less."}),
  company: z.string().max(100, { message: "Company name must be 100 characters or less."}).optional().or(z.literal('')),
  date: z.string().min(3, { message: "Date must be at least 3 characters." }).max(50, { message: "Date must be 50 characters or less."}),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  tags: z.string().optional().or(z.literal('')), // Comma-separated string
});

export type ExperienceFormData = z.infer<typeof experienceFormSchema>;
