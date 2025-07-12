import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/solutions`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Solution pages (only unique ones)
  const solutionPages = uniqueProjects.map((project) => ({
    url: `${baseUrl}/solutions/${project.slug}`,
    lastModified: project.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...solutionPages];
} 