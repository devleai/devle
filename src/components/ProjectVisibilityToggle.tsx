"use client";
import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GlobeIcon, LockIcon } from "lucide-react";

export function ProjectVisibilityToggle({ value, onChange, disabledPrivate }: {
  value: "public" | "private",
  onChange: (v: "public" | "private") => void,
  disabledPrivate?: boolean
}) {
  const router = useRouter();
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={v => {
        if (v === "private" && disabledPrivate) {
          router.push("/pricing");
        } else if (v) {
          onChange(v as "public" | "private");
        }
      }}
      className="w-full max-w-xs border rounded-lg bg-muted"
      variant="outline"
      size="default"
    >
      <ToggleGroupItem
        value="public"
        aria-label="Public"
        className={`flex-1 flex flex-col items-start px-4 py-2 gap-1 min-w-0 ${value === 'public' ? 'border-primary bg-primary/10 text-primary' : ''}`}
      >
        <div className="flex items-center gap-2">
          <GlobeIcon className="w-4 h-4" />
          <span className="font-medium">Public</span>
        </div>
        <span className="text-xs text-muted-foreground">Anyone can view and remix</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="private"
        aria-label="Private"
        className={`flex-1 flex flex-col items-start px-4 py-2 gap-1 min-w-0 ${value === 'private' ? 'border-blue-600 bg-blue-50 text-blue-700' : ''}`}
        disabled={disabledPrivate}
      >
        <div className="flex items-center gap-2">
          <LockIcon className="w-4 h-4" />
          <span className="font-medium">Private</span>
          {disabledPrivate && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Pro</span>}
        </div>
        <span className="text-xs text-muted-foreground">Only visible to your workspace</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
} 