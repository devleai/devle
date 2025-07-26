import { Metadata } from "next";
import { SolutionsClient } from "./SolutionsClient";
import { getPublicSolutions } from "@/lib/solutions";

export const metadata: Metadata = {
  title: "AI Solutions - Devle",
  description: "Discover unique AI-generated web applications, websites, and projects built with Devle. Browse our curated collection of solutions including Netflix clones, e-commerce sites, social media apps, and more. Each project is created by AI through natural conversation - see what's possible when you chat with AI to build software.",
  openGraph: {
    title: "AI Solutions - Devle",
    description: "Discover unique AI-generated web applications, websites, and projects built with Devle. Browse our curated collection of solutions including Netflix clones, e-commerce sites, social media apps, and more.",
    type: "website",
    url: "/solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Solutions - Devle",
    description: "Discover unique AI-generated web applications, websites, and projects built with Devle. Browse our curated collection of solutions.",
  },
  keywords: [
    "AI solutions",
    "AI-generated projects", 
    "web applications",
    "website builder",
    "AI coding",
    "software development",
    "chat with AI",
    "Devle",
    "AI projects",
    "web development"
  ],
};

export default async function SolutionsPage() {
  const projects = await getPublicSolutions();
  return (
    <div className="container mx-auto px-4 py-8">
      <SolutionsClient projects={projects} />
    </div>
  );
} 