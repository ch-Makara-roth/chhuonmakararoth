
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { JourneyItem } from '@/lib/data';
import { type Collection, type WithId } from 'mongodb';

// Note: JourneyItem is used for experience as per current data structure.
export async function GET() {
  try {
    const db = await getDb();
    const experienceCollection: Collection<Omit<JourneyItem, 'id'>> = db.collection('experience');
    
    // Assuming JourneyItem has a 'date' field that can be used for sorting,
    // or a dedicated order field. For simplicity, sorting by 'date' string descending.
    // Proper date sorting would require date objects in DB or more complex sort logic.
    const experienceFromDb = await experienceCollection.find({}).sort({ date: -1 }).toArray();

    const experience: JourneyItem[] = experienceFromDb.map((item: WithId<Omit<JourneyItem, 'id'>>) => {
      const { _id, ...rest } = item;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return NextResponse.json(experience);
  } catch (error: any) {
    console.error('Failed to fetch experience data from MongoDB:', error);
    return NextResponse.json(
      { message: 'Failed to fetch experience data', error: error.message },
      { status: 500 }
    );
  }
}
