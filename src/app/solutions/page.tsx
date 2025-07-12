import { Metadata } from "next";
import Link from "next/link";

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/solutions`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch solutions');
  }
  
  const projects = await response.json();
  return projects;
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
          {projects.map((project: any) => (
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