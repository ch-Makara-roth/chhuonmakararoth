
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Project } from '@/lib/data'; // Keep this for type consistency if needed elsewhere

export async function GET() {
  try {
    const projects: Project[] = await prisma.project.findMany({
      orderBy: {
        // Assuming you want to sort by a date field.
        // If startDate is a string like "Jan 2023", direct sorting might be tricky.
        // For robust sorting, consider storing dates as ISO strings or Unix timestamps.
        // For now, let's assume we might sort by createdAt or another field.
        createdAt: 'desc', // Example: Sort by creation date
      },
    });
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Failed to fetch projects from MongoDB via Prisma:', error);
    return NextResponse.json(
      { message: 'Failed to fetch projects', error: error.message },
      { status: 500 }
    );
  }
}
