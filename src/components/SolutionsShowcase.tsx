"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";

interface SolutionsShowcaseProps {
  maxItems?: number;
  allowedCategories?: string[];
  showViewAll?: boolean;
}

export function SolutionsShowcase({ maxItems = 6, allowedCategories, showViewAll = true }: SolutionsShowcaseProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchSolutions() {
      setLoading(true);
      const res = await fetch("/api/solutions");
      const data = await res.json();
      setProjects(data);
      setLoading(false);
    }
    fetchSolutions();
  }, []);

  // Filter out projects created less than 2 minutes ago
  const TWO_MINUTES = 2 * 60 * 1000;
  const now = Date.now();
  let filteredProjects = projects.filter(
    (project: any) => now - new Date(project.createdAt).getTime() > TWO_MINUTES
  );

  // Filter by allowedCategories if provided
  if (allowedCategories && allowedCategories.length > 0) {
    filteredProjects = filteredProjects.filter((p: any) => allowedCategories.includes(p.category));
  }

  // Get unique categories
  const categories: string[] = Array.from(new Set(filteredProjects.map((p: any) => p.category || 'Other')));
  categories.sort();
  categories.unshift('All');

  // Filter by selected category
  const visibleProjects = selectedCategory === 'All'
    ? filteredProjects
    : filteredProjects.filter((p: any) => (p.category || 'Other') === selectedCategory);

  // Limit to maxItems
  const shownProjects = visibleProjects.slice(0, maxItems);

  return (
    <div className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Community projects</h2>
      </div>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        setSelected={setSelectedCategory}
      />
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shownProjects.map((project: any) => (
            <div
              key={project.id}
              className="group block p-2"
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
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {project.messages[0]?.fragment?.title || project.name}
              </h3>

            </div>
          ))}
        </div>
      )}
      {shownProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No public solutions yet.</p>
        </div>
      )}
    </div>
  );
} 