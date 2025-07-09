import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { GlobeIcon, LockIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export function ProjectVisibilityDropdown({ value, onChange }: {
  value: "public" | "private",
  onChange: (v: "public" | "private") => void,
}) {
  const { has } = useAuth();
  const isPro = has?.({ plan: "pro" });

  return (
    <DropdownMenu>
      <div className="relative">
        <DropdownMenuTrigger asChild>
          <button
            className="absolute bottom-0 left-0 flex items-center gap-2 px-2 py-1 rounded-full bg-muted border text-base font-medium shadow transition hover:bg-accent"
          >
            {value === "public" ? (
              <>
                <GlobeIcon className="w-5 h-5" />
                Public
                <span className="invisible">e</span>
              </>
            ) : (
              <>
                <LockIcon className="w-5 h-5" />
                Private
              </>
            )}
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => isPro && onChange("private")}
          disabled={!isPro}
          className={value === "private" ? "font-bold text-blue-700" : ""}
        >
          <LockIcon className="w-4 h-4 mr-2" />
          Private
          {!isPro && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Pro</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChange("public")}
          className={value === "public" ? "font-bold text-primary" : ""}
        >
          <GlobeIcon className="w-4 h-4 mr-2" />
          Public
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 