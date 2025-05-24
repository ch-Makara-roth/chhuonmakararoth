
import { NextResponse } from 'next/server';
import { skillsData } from '@/lib/data';
import type { Skill } from '@/lib/data';

export async function GET() {
  try {
    const skills: Skill[] = skillsData;
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return NextResponse.json({ message: 'Failed to fetch skills' }, { status: 500 });
  }
}
