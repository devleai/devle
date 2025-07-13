import { NextResponse } from 'next/server';
import { getPublicSolutions } from '@/lib/solutions';

export async function GET() {
  try {
    const projects = await getPublicSolutions();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
} 