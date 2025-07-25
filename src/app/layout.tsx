import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import Script from 'next/script';
import { Analytics } from "@vercel/analytics/next"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devle AI",
  description: "Ai website builder",
  verification: {
    google: "MZCBO39B4zdDXznmTHkuNXvbKvesrG1AUjuI4enciZQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
    appearance={{
      variables: {
        colorPrimary: "#AE68F5",
      }
    }}
    >

    <TRPCReactProvider>

    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
                <Analytics />

  <Script
      defer
      data-website-id="6861a1c076156f47b9239101"
      data-domain="devle.ai"
      src="https://datafa.st/js/script.js"
      strategy="afterInteractive"
    />

        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        >
        <Toaster />
        {children}
        </ThemeProvider>
      </body>
    </html>
    </TRPCReactProvider>
        </ClerkProvider>

  );
};
