import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://devle.ai';
    
    // Get all public projects with slugs and titles
    const publicProjects = await prisma.project.findMany({
      where: {
        visibility: "public",
        slug: { not: null },
      },
      select: {
        slug: true,
        updatedAt: true,
        messages: {
          where: {
            fragment: {
              isNot: null,
            },
          },
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            fragment: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Filter out duplicates based on title
    const uniqueProjects = [];
    const seenTitles = new Set();

    for (const project of publicProjects) {
      const title = project.messages[0]?.fragment?.title || "";
      const normalizedTitle = title.toLowerCase().trim();
      
      // Check if we've seen this title before
      if (seenTitles.has(normalizedTitle)) {
        continue; // Skip duplicate titles
      }

      uniqueProjects.push(project);
      seenTitles.add(normalizedTitle);
    }

    // Create XML for solutions only
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/solutions</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${uniqueProjects.map((project) => `  <url>
    <loc>${baseUrl}/solutions/${project.slug}</loc>
    <lastmod>${project.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating solutions sitemap:', error);
    return NextResponse.json(
      { error: 'Failed to generate solutions sitemap' },
      { status: 500 }
    );
  }
} 