"use client";
import Link from "next/link"; 
import Image from "next/image"; 
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs"; 
import { Button } from "@/components/ui/button"; 
import { UserControl } from "@/components/user-control";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";

export const Navbar = () => {
    const isScrolled = useScroll();
    const pathname = usePathname();
    const isHomepage = pathname === "/";

  return (
    <nav className={cn(
        "p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent",

        isScrolled && "bg-background border-border"
        
        )}
        
        >
 <div>
      <p className="flex justify-center text-sm">
        <a href="/pricing" className="group">
          

          <span className={cn("me-1 text-base leading-none", !isScrolled && isHomepage && "text-white")}>   <span className="me-1 text-base leading-none ">✨</span>       Beta access: Prices rising soon          </span>

                    <ArrowRightIcon
            className="ms-2 -mt-0.5 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5"
            size={16}
            aria-hidden="true"
          />
        </a>
      </p>
    </div>
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Devle" width={24} height={24} />
            <span className={cn("font-semibold text-lg", !isScrolled && isHomepage && "text-white")}>Devle</span>
            </Link>
            <SignedOut>
                <div className="flex gap-2">
                    <SignUpButton>
                        <Button variant="outline" size="sm">
                            Sign up
                        </Button>
                    </SignUpButton>
                    <SignInButton>
                        <Button size="sm">
                            Sign in
                        </Button>
                    </SignInButton>
                </div>
            </SignedOut>

            <SignedIn>
               <UserControl showName isScrolled={isScrolled} isHomepage={isHomepage} />
            </SignedIn>
        </div>
    </nav>
  );
};
