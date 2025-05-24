
import { NextResponse } from 'next/server';
import { projectsData } from '@/lib/data';
import type { Project } from '@/lib/data';

export async function GET() {
  try {
    // In a real scenario with a database, you would fetch data here.
    // For now, we're returning the static data.
    const projects: Project[] = projectsData;
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ message: 'Failed to fetch projects' }, { status: 500 });
  }
}
