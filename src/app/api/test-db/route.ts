import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check fragments
    const fragments = await prisma.fragment.findMany({
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
                visibility: true,
                id: true
              }
            }
          }
        }
      }
    });

    // Check projects
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        visibility: true,
        createdAt: true,
        messages: {
          select: {
            id: true,
            fragment: {
              select: {
                sandboxUrl: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      fragments: {
        count: fragments.length,
        data: fragments
      },
      projects: {
        count: projects.length,
        data: projects
      }
    });
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 