import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

export async function POST(req: NextRequest) {
  try {
    // Get all public projects without slugs
    const projects = await prisma.project.findMany({
      where: {
        visibility: "public",
        slug: null,
      },
      select: {
        id: true,
        name: true,
        messages: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { content: true },
        },
      },
    });

    console.log(`Found ${projects.length} public projects without slugs`);

    const results = [];

    for (const project of projects) {
      // Trigger the Inngest function for each project
      await inngest.send({
        name: "project/public-created",
        data: {
          projectId: project.id,
        },
      });

      results.push({
        projectId: project.id,
        message: project.messages[0]?.content || "No message",
      });

      console.log(`Triggered slug generation for project ${project.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Triggered slug generation for ${results.length} projects`,
      results,
    });
  } catch (error) {
    console.error('Error triggering slug generation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger slug generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 