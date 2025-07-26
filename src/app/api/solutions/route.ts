import { NextResponse } from 'next/server';
import { getPublicSolutions } from '@/lib/solutions';

// Cache the solutions for 30 minutes to reduce database load
const CACHE_DURATION = 30 * 60; // 30 minutes in seconds

export async function GET() {
  try {
    const projects = await getPublicSolutions();
    return NextResponse.json(projects, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
      },
    });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
} 