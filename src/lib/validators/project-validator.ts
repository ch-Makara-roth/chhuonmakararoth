
import { z } from 'zod';

const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// Schema for text fields, imageUrl will be added by the server action after file processing
export const projectFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100, { message: "Title must be 100 characters or less."}),
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug must be lowercase alphanumeric with hyphens, or leave empty to auto-generate."})
    .max(100, { message: "Slug must be 100 characters or less."})
    .optional()
    .or(z.literal('')),
  shortDescription: z.string().min(10, { message: "Short description must be at least 10 characters." }).max(200, { message: "Short description must be 200 characters or less."}),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  // imageUrl is handled by file upload logic, validated as string path before DB save
  dataAiHint: z.string().max(50, { message: "AI hint must be 50 characters or less."}).optional().or(z.literal('')),
  technologies: z.string().optional().or(z.literal('')), // Comma-separated string
  liveLink: z.string().url({ message: "Please enter a valid URL for the live link." }).optional().or(z.literal('')),
  repoLink: z.string().url({ message: "Please enter a valid URL for the repository link." }).optional().or(z.literal('')),
  startDate: z.string().min(1, { message: "Start date is required." }).max(50, { message: "Start date must be 50 characters or less."}),
  endDate: z.string().max(50, { message: "End date must be 50 characters or less."}).optional().or(z.literal('')),
  detailsImagesString: z.string().optional().or(z.literal('')), // Comma-separated URLs
  featuresString: z.string().optional().or(z.literal('')),      // Comma-separated features
});

// This type is for the data extracted from FormData in server actions, before DB insertion
export type ProjectProcessedFormData = z.infer<typeof projectFormSchema> & {
  imageUrl: string; // After file upload, this will be the path
};

// This type represents the raw form data structure from react-hook-form on the client
// It includes the imageFile field.
export type ProjectClientFormData = z.infer<typeof projectFormSchema> & {
  imageFile?: FileList | null;
  currentImageUrl?: string; // To display current image when editing
};
