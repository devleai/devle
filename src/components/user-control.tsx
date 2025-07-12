"use client";
import { useCurrentTheme } from "@/hooks/use-current-theme";
import { UserButton } from "@clerk/nextjs";

import { dark } from "@clerk/themes"

interface Props {
  showName?: boolean;
  isScrolled?: boolean;
  isHomepage?: boolean;
}

export const UserControl = ({ showName, isScrolled, isHomepage }: Props) => {

    const currentTheme = useCurrentTheme();
  return (
    <UserButton
      showName={showName}
      appearance={{
        elements: {
          userButtonBox: "rounded-md!",
          userButtonAvatarBox: "rounded-md size-8!",
          userButtonTrigger: "rounded-md!",
          userButtonOuterIdentifier: isScrolled === false && isHomepage ? "text-white!" : "",
        },
        baseTheme: currentTheme === "dark" ? dark : undefined,
      }}
    />
  );
};
