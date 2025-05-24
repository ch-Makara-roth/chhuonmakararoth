
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Skill } from '@/lib/data'; // Keep for type consistency

export async function GET() {
  try {
    // Prisma model 'Skill' should match the 'Skill' type structure.
    const skills: Skill[] = await prisma.skill.findMany({
      orderBy: {
        proficiency: 'desc', // Sort by proficiency descending
      },
    });
    return NextResponse.json(skills);
  } catch (error: any) {
    console.error('Failed to fetch skills from MongoDB via Prisma:', error);
    return NextResponse.json(
      { message: 'Failed to fetch skills', error: error.message },
      { status: 500 }
    );
  }
}
