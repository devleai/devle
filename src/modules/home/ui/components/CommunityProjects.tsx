"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export const CommunityProjects = () => {
  const trpc = useTRPC();
  const { data: screenshots, isLoading, error } = useQuery(trpc.projects.getLatestScreenshots.queryOptions());

  console.log('CommunityProjects - screenshots:', screenshots);
  console.log('CommunityProjects - isLoading:', isLoading);
  console.log('CommunityProjects - error:', error);

  if (isLoading) return <div className="p-8">Loading community projects...</div>;
  if (error) return <div className="p-8">Error loading community projects: {error.message}</div>;
  if (!Array.isArray(screenshots) || screenshots.length === 0) return <div className="p-8">No community projects found</div>;

  return (
    <section className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4 mt-8">
      <h2 className="text-2xl font-semibold mb-4">Community Projects ({screenshots.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {screenshots.map((screenshot) => (
          <div key={screenshot.id} className="flex flex-col border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-3 border-b font-medium truncate">Project Preview</div>
            <div
              className="w-full aspect-[16/10] bg-muted rounded-lg overflow-hidden flex items-center justify-center"
              style={{ minWidth: "320px", maxWidth: "100%" }}
            >
              {screenshot.imageUrl.includes('placeholder.com') ? (
                <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">🖼️</div>
                    <div className="text-sm mb-2">Screenshot not available</div>
                    <a 
                      href={screenshot.sandboxUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Project
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={screenshot.imageUrl}
                  alt="Project Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image failed to load:', screenshot.imageUrl);
                    // Replace with fallback content
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'flex items-center justify-center w-full h-full bg-muted text-muted-foreground';
                    fallback.innerHTML = `
                      <div class="text-center p-4">
                        <div class="text-2xl mb-2">🔗</div>
                        <div class="text-sm mb-2">Screenshot failed</div>
                        <a href="${screenshot.sandboxUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:underline">View Project</a>
                      </div>
                    `;
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};