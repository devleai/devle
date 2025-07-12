import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "AI Solutions - Devle",
  description: "Discover unique AI-generated web applications, websites, and projects built with Devle. Browse our curated collection of solutions including Netflix clones, e-commerce sites, social media apps, and more. Each project is created by AI through natural conversation - see what's possible when you chat with AI to build software.",
  openGraph: {
    title: "AI Solutions - Devle",
    description: "Discover unique AI-generated web applications, websites, and projects built with Devle. Browse our curated collection of solutions including Netflix clones, e-commerce sites, social media apps, and more.",
    type: "website",
    url: "/solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Solutions - Devle",
    description: "Discover unique AI-generated web applications, websites, and projects built with Devle. Browse our curated collection of solutions.",
  },
  keywords: [
    "AI solutions",
    "AI-generated projects", 
    "web applications",
    "website builder",
    "AI coding",
    "software development",
    "chat with AI",
    "Devle",
    "AI projects",
    "web development"
  ],
};

async function getPublicProjects() {
  const projects = await prisma.project.findMany({
    where: {
      visibility: "public",
      slug: { not: null },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Get more to filter
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      messages: {
        where: {
          fragment: {
            isNot: null,
          },
        },
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

  return uniqueProjects.slice(0, 50); // Return top 50 unique projects
}

export default async function SolutionsPage() {
  const projects = await getPublicProjects();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Solutions</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Explore AI-generated solutions and projects built with Devle
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/solutions/${project.slug}`}
              className="group block p-6 border rounded-lg hover:border-primary transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {project.messages[0]?.fragment?.title || project.name}
              </h2>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {project.messages[0]?.content || "AI-generated solution"}
              </p>
              <div className="text-xs text-muted-foreground">
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No public solutions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 