import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ChevronDownIcon, ChevronLeftIcon, EditIcon, SunMoonIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ProjectVisibilityDropdown } from "@/components/ProjectVisibilityDropdown";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { GlobeIcon, LockIcon } from "lucide-react";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );

    const { setTheme, theme } = useTheme();

    const normalizeVisibility = (v: string): 'public' | 'private' => v === 'workspace' ? 'private' : (v as 'public' | 'private');
    const { has } = useAuth();
    const isPro = has?.({ plan: "pro" });
    const [visibility, setVisibility] = useState<'public' | 'private'>(isPro ? 'private' : normalizeVisibility(project.visibility));
    const updateVisibility = useMutation(trpc.projects.updateVisibility.mutationOptions({
      onSuccess: () => { /* show toast or refetch */ }
    }));

    return (
    <header className="p-2 flex justify-between items-center border-b">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                variant="ghost"
                size="sm"
                className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!"
                >
                    <Image src="/logo.svg" alt="Devle" width={18} height={18} />
                    <span className="text-sm font-medium">{project.name}</span>
                    <ChevronDownIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
                <DropdownMenuItem asChild>
                    <Link href="/">
                    <ChevronLeftIcon />
                    <span>Go to dashboard</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                        <SunMoonIcon className="size-4 text-muted-foreground" />
                        <span>Appearance</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                <DropdownMenuRadioItem value="light"> 
                                    <span>Light</span>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="dark"> 
                                    <span>Dark</span>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="system"> 
                                    <span>System</span>
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                        {visibility === 'public' ? <GlobeIcon className="size-4 text-muted-foreground" /> : <LockIcon className="size-4 text-muted-foreground" />}
                        <span>Project Visibility</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={visibility} onValueChange={v => {
                                setVisibility(v as 'public' | 'private');
                                updateVisibility.mutate({ projectId: project.id, visibility: v as 'public' | 'private' });
                            }}>
                                <DropdownMenuRadioItem value="public">
                                    <GlobeIcon className="w-4 h-4 mr-2" />
                                    <span>Public</span>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="private" disabled={!isPro}>
                                    <LockIcon className="w-4 h-4 mr-2" />
                                    <span>Private</span>
                                    {!isPro && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Pro</span>}
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    </header>
    );
};
