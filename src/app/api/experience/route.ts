
import { NextResponse } from 'next/server';
import { journeyData } from '@/lib/data';
import type { JourneyItem } from '@/lib/data';

// Note: JourneyItem is used for experience as per current data structure.
// This can be refactored to a dedicated ExperienceItem type later if needed.
export async function GET() {
  try {
    const experience: JourneyItem[] = journeyData;
    return NextResponse.json(experience);
  } catch (error) {
    console.error('Failed to fetch experience data:', error);
    return NextResponse.json({ message: 'Failed to fetch experience data' }, { status: 500 });
  }
}
