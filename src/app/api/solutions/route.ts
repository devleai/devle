import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        visibility: "public",
        slug: { not: null },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            content: true,
            fragment: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Filter out duplicates based on title similarity
    const uniqueProjects = [];
    const seenTitles = new Set();

    for (const project of projects) {
      const title = project.messages[0]?.fragment?.title || project.name;
      const normalizedTitle = title.toLowerCase().trim();
      
      // Check if we've seen this title before
      if (seenTitles.has(normalizedTitle)) {
        continue; // Skip duplicate titles
      }

      uniqueProjects.push(project);
      seenTitles.add(normalizedTitle);
    }

    return NextResponse.json(uniqueProjects.slice(0, 50));
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
} 