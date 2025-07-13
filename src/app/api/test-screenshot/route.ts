import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Get the project and its latest fragment
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        visibility: true,
        messages: {
          where: {
            fragment: {
              isNot: null
            }
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            fragment: {
              select: {
                sandboxUrl: true,
                title: true
              }
            }
          }
        },
        screenshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            imageUrl: true,
            createdAt: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const fragment = project.messages[0]?.fragment;
    if (!fragment?.sandboxUrl) {
      return NextResponse.json({ error: 'No sandbox URL found' }, { status: 400 });
    }

    // Test the screenshot API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = encodeURIComponent(fragment.sandboxUrl);
    const encodedProjectId = encodeURIComponent(project.id);
    
    console.log('Testing screenshot generation for:', {
      projectId: project.id,
      sandboxUrl: fragment.sandboxUrl,
      existingScreenshots: project.screenshots.length
    });

    const response = await fetch(`${baseUrl}/api/screenshot?url=${url}&projectId=${encodedProjectId}`);
    const result = await response.json();

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        visibility: project.visibility,
        fragmentTitle: fragment.title,
        sandboxUrl: fragment.sandboxUrl,
        existingScreenshots: project.screenshots.length
      },
      screenshotResult: {
        status: response.status,
        ok: response.ok,
        data: result
      }
    });

  } catch (error) {
    console.error('Test screenshot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 