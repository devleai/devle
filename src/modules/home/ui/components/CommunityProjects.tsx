"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useEffect, useState } from "react";

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/trpc/routers/_app';

type Fragment = {
  id: string;
  sandboxUrl: string;
  title: string;
  createdAt: string;
  visibility: string; // <-- add this
};

export const CommunityProjects = () => {
  const trpc = useTRPC();
  const { data: fragments, isLoading } = useQuery(trpc.projects.getCommunityFragments.queryOptions());
  const [liveFragments, setLiveFragments] = useState<Fragment[]>([]);
  const [screenshotUrls, setScreenshotUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!Array.isArray(fragments) || fragments.length === 0) return;
    let cancelled = false;
    (async () => {
      const checks = await Promise.all(
        fragments.map(async (frag) => {
          try {
            // Wait a few seconds before taking screenshot
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Fetch screenshot URL from API
            const screenshotRes = await fetch(`/api/screenshot?url=${frag.sandboxUrl}`);
            const screenshotData = await screenshotRes.json();
            console.log('Screenshot API', frag.sandboxUrl, screenshotData); // DEBUG
            if (!cancelled && screenshotData.imageUrl && !screenshotData.error) {
              setScreenshotUrls(prev => ({ ...prev, [frag.id]: screenshotData.imageUrl }));
              return { ...frag, createdAt: new Date(frag.createdAt).toISOString() };
            }
            return null;
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) setLiveFragments(checks.filter(Boolean) as Fragment[]);
    })();
    return () => { cancelled = true; };
  }, [fragments]);

  if (isLoading) return <div className="p-8">Loading community projects...</div>;
  if (!Array.isArray(fragments) || fragments.length === 0) return <div className="p-8">No community projects found (debug: {JSON.stringify(fragments)})</div>;
  
  // Show placeholder layout immediately while screenshots load
  const displayFragments = liveFragments.length > 0 ? liveFragments : fragments.slice(0, 6);
  
  // Sort by creation date (newest first)
  const sortedFragments = displayFragments.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4 mt-8">
      <h2 className="text-2xl font-semibold mb-4">Community Projects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedFragments.slice(0, 6).map((frag) => (
          <div key={frag.id} className="flex flex-col border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="p-3 border-b font-medium truncate">{frag.title}</div>
            <div
              className="w-full aspect-[16/10] bg-muted rounded-lg overflow-hidden flex"
              style={{ minWidth: "320px", maxWidth: "100%" }}
            >
              <img
                src={screenshotUrls[frag.id] || "/placeholder.png"}
                alt={frag.title}
                className="w-full h-full object-cover"
                style={{ display: "block", background: "white", border: "none" }}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};