
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { Project } from '@/lib/data';
import { type Collection, type WithId } from 'mongodb';

export async function GET() {
  try {
    const db = await getDb();
    // Define the type for documents in MongoDB, excluding 'id' as it's derived from '_id'
    const projectsCollection: Collection<Omit<Project, 'id'>> = db.collection('projects');
    
    const projectsFromDb = await projectsCollection.find({}).sort({ startDate: -1 }).toArray(); // Example sort

    const projects: Project[] = projectsFromDb.map((p: WithId<Omit<Project, 'id'>>) => {
      const { _id, ...rest } = p;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Failed to fetch projects from MongoDB:', error);
    return NextResponse.json(
      { message: 'Failed to fetch projects', error: error.message },
      { status: 500 }
    );
  }
}
