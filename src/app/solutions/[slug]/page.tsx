import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/modules/home/ui/components/project-form";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProjectBySlug(slug: string) {
  const project = await prisma.project.findFirst({
    where: {
      slug: slug,
      visibility: "public",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          role: true,
          type: true,
          fragment: {
            select: {
              sandboxUrl: true,
              title: true,
            },
          },
        },
      },
    },
  });

  return project;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Solution Not Found - Devle",
    };
  }

  const firstMessage = project.messages[0]?.content || "";
  const title = project.messages[0]?.fragment?.title || project.name;
  const description = `Build ${title} using AI with Devle. Create apps and websites by chatting with AI.`;

  return {
    title: `Build ${title} using AI - Devle`,
    description: description,
    openGraph: {
      title: `Build ${title} using AI - Devle`,
      description: description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Build ${title} using AI - Devle`,
      description: description,
    },
  };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const firstMessage = project.messages[0]?.content || "";
  const fragment = project.messages.find(m => m.fragment)?.fragment;
  const title = fragment?.title || project.name;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh" }}>
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url('/landscape.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      />
      {/* Content */}
      <div
        className="flex flex-col max-w-5xl mx-auto w-full px-4"
        style={{ position: "relative", zIndex: 2 }}
      >
        <Link href="/solutions" className="inline-flex items-center text-white/80 hover:text-white mb-8 mt-8">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Solutions
        </Link>

        <section className="space-y-6 py-[16vh] 2xl:py-48">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="Devle"
              width={50}
              height={50}
              className="hidden md:block"
            />
          </div>
          <h1 className="text-2xl text-5xl font-bold text-center text-white">
            Build a {title} with our AI site builder
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center text-white">
            Create a {title} by chatting with our AI
          </p>

          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm defaultPrompt={firstMessage} />
          </div>
        </section>

        {/* Demo Section */}
        {fragment && (
          <div className="bg-white dark:bg-sidebar rounded-xl p-8 border mb-8">
            <h2 className="text-2xl font-semibold mb-4">Live Demo</h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={fragment.sandboxUrl}
                className="w-full h-96 border-0"
                title={fragment.title}
              />
            </div>
            <div className="mt-4">
              <Link href={fragment.sandboxUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  Open in New Tab
                  <ExternalLinkIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="bg-white dark:bg-sidebar rounded-xl p-8 border mb-8">
          <h2 className="text-2xl font-semibold mb-4">Project Details</h2>
          <div className="grid gap-4 text-sm text-muted-foreground">
            <div>
              <strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>Project ID:</strong> {project.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 