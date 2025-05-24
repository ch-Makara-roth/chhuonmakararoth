
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { JourneyItem } from '@/lib/data'; // Keep for type consistency

// Note: JourneyItem is used for experience as per current data structure.
// Prisma model is named 'Experience'.
export async function GET() {
  try {
    // The JourneyItem type might need alignment with Prisma's Experience model,
    // especially if field names or types differ slightly.
    // Prisma returns objects matching the model structure.
    const experienceItems = await prisma.experience.findMany({
      orderBy: {
        // Assuming 'date' is a string field that might represent a period.
        // Proper date-based sorting would require the 'date' field to be
        // a DateTime type in Prisma and a parsable date string or Date object in MongoDB.
        // For simplicity, if 'date' can be lexicographically sorted (e.g. "YYYY-MM"), this might work.
        // Otherwise, consider sorting by 'createdAt' or adding an 'order' field.
        createdAt: 'desc', // Example: Sort by creation date
      },
    });

    // Map Prisma 'Experience' items to 'JourneyItem' if necessary,
    // though Prisma Client typically returns id as string if @map("_id") is used.
    const experience: JourneyItem[] = experienceItems.map(item => ({
        ...item,
        // Ensure all fields of JourneyItem are covered.
        // If Prisma model 'Experience' directly matches 'JourneyItem' (excluding id mapping handled by Prisma),
        // this explicit mapping might be simplified or removed.
    }));


    return NextResponse.json(experience);
  } catch (error: any) {
    console.error('Failed to fetch experience data from MongoDB via Prisma:', error);
    return NextResponse.json(
      { message: 'Failed to fetch experience data', error: error.message },
      { status: 500 }
    );
  }
}
