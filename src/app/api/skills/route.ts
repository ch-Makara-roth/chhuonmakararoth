
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { Skill } from '@/lib/data';
import { type Collection, type WithId } from 'mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const skillsCollection: Collection<Omit<Skill, 'id'>> = db.collection('skills');
    
    // Sort by proficiency descending as an example
    const skillsFromDb = await skillsCollection.find({}).sort({ proficiency: -1 }).toArray();

    const skills: Skill[] = skillsFromDb.map((skill: WithId<Omit<Skill, 'id'>>) => {
      const { _id, ...rest } = skill;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return NextResponse.json(skills);
  } catch (error: any) {
    console.error('Failed to fetch skills from MongoDB:', error);
    return NextResponse.json(
      { message: 'Failed to fetch skills', error: error.message },
      { status: 500 }
    );
  }
}
