import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Simple test query
    const count = await prisma.project.count({
      where: {
        visibility: "public",
      },
    });
    
    return NextResponse.json({
      success: true,
      publicProjectsCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 