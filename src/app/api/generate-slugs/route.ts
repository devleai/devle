import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
      const firstMessage = project.messages[0]?.content || "";
      
      // Create a URL-friendly slug from the message content
      const baseSlug = firstMessage
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .substring(0, 50);

      // Ensure uniqueness by adding project ID suffix if needed
      const existingProject = await prisma.project.findFirst({
        where: { slug: baseSlug },
      });

      let finalSlug = baseSlug;
      if (existingProject && existingProject.id !== project.id) {
        finalSlug = `${baseSlug}-${project.id.substring(0, 8)}`;
      }

      // Update project with slug
      await prisma.project.update({
        where: { id: project.id },
        data: { slug: finalSlug },
      });

      results.push({
        projectId: project.id,
        slug: finalSlug,
        originalMessage: firstMessage,
      });

      console.log(`Generated slug for project ${project.id}: ${finalSlug}`);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${results.length} slugs`,
      results,
    });
  } catch (error) {
    console.error('Error generating slugs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate slugs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 