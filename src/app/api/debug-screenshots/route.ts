import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const screenshots = await prisma.screenshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const fragments = await prisma.fragment.findMany({
      where: {
        message: {
          project: { visibility: "public" }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        sandboxUrl: true,
        title: true,
        createdAt: true,
        message: {
          select: {
            project: {
              select: {
                visibility: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      screenshots,
      fragments,
      screenshotCount: screenshots.length,
      fragmentCount: fragments.length,
      env: {
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 