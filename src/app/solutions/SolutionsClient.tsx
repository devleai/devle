"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";

export function SolutionsClient() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/solutions');
        if (!response.ok) {
          throw new Error('Failed to fetch solutions');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching solutions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch solutions');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter out projects created less than 2 minutes ago
  const TWO_MINUTES = 2 * 60 * 1000;
  const now = Date.now();
  const filteredProjects = projects.filter(
    (project: any) => now - new Date(project.createdAt).getTime() > TWO_MINUTES
  );

  const categories: string[] = Array.from(new Set(filteredProjects.map((p: any) => p.category || 'Other')));
  categories.sort();
  categories.unshift('All');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const visibleProjects = selectedCategory === 'All'
    ? filteredProjects
    : filteredProjects.filter((p: any) => (p.category || 'Other') === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Solutions</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Explore AI-generated solutions and projects built with Devle
        </p>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading solutions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Solutions</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Explore AI-generated solutions and projects built with Devle
        </p>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Error loading solutions: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">AI Solutions</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Explore AI-generated solutions and projects built with Devle
      </p>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        setSelected={setSelectedCategory}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((project: any) => (
          <Link
            key={project.id}
            href={`/solutions/${project.slug}`}
            className="group block p-6 border rounded-lg hover:border-primary transition-colors"
          >
            {project.screenshots && project.screenshots[0]?.imageUrl && (
              <div className="mb-4 rounded overflow-hidden border bg-muted">
                <img
                  src={project.screenshots[0].imageUrl}
                  alt={project.messages[0]?.fragment?.title || project.name}
                  className="w-full h-40 object-cover"
                  width={320}
                  height={160}
                  loading="lazy"
                />
              </div>
            )}
            <div className="mb-2 text-xs font-semibold text-primary/80 uppercase tracking-wide">
              {project.category || 'Other'}
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              {project.messages[0]?.fragment?.title || project.name}
            </h2>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
              {project.messages[0]?.content || "AI-generated solution"}
            </p>
            <div className="text-xs text-muted-foreground">
              {new Date(project.createdAt).toISOString().slice(0, 10)}
            </div>
          </Link>
        ))}
      </div>
      {visibleProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No public solutions yet.</p>
        </div>
      )}
    </div>
  );
} 