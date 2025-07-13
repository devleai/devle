import { prisma } from "@/lib/db";

export async function getPublicSolutions() {
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
      category: true,
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          content: true,
          type: true,
          fragment: {
            select: {
              title: true,
            },
          },
        },
      },
      screenshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          imageUrl: true,
        },
      },
    },
  });

  // Filter out duplicates based on title similarity
  const uniqueProjects = [];
  const seenTitles = new Set();

  for (const project of projects) {
    const msg = project.messages[0];
    const title = msg?.fragment?.title || project.name;
    const normalizedTitle = title.toLowerCase().trim();
    // Only include if not error and has a valid fragment titles
    if (
      msg?.type === "ERROR" ||
      !msg?.fragment?.title ||
      seenTitles.has(normalizedTitle)
    ) {
      continue;
    }
    uniqueProjects.push(project);
    seenTitles.add(normalizedTitle);
  }

  return uniqueProjects.slice(0, 50);
} 