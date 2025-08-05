export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache the sitemap for 1 hour to reduce database load
const CACHE_DURATION = 60 * 60; // 1 hour in seconds

export async function GET() {
  try {
    console.log('Starting solutions sitemap generation...');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://devle.ai';
    
    // Check if we should use a simple fallback (for quota issues)
    const useFallback = process.env.USE_SITEMAP_FALLBACK === 'true';
    
    if (useFallback) {
      console.log('Using fallback sitemap (no database query)');
      const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/solutions</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      return new NextResponse(fallbackXml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
        },
      });
    }
    
    // Simplified query to avoid hitting database quotas
    const publicProjects = await prisma.project.findMany({
      where: {
        visibility: "public",
        slug: { not: null },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500, // Reduced limit to avoid quota issues
      select: {
        slug: true,
        updatedAt: true,
        name: true, // Use project name instead of complex fragment query
      },
    });

    console.log(`Total public projects with slugs: ${publicProjects.length}`);

    // Simple filtering - just use all projects since we're not doing complex title matching
    const uniqueProjects = publicProjects.filter(project => project.slug);
    
    console.log(`Filtered projects with valid slugs: ${uniqueProjects.length}`);

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
        'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
      },
    });
  } catch (error) {
    console.error('Error generating solutions sitemap:', error);
    
    // Return a minimal sitemap with just the main solutions page if database fails
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://devle.ai';
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/solutions</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
      },
    });
  }
} 