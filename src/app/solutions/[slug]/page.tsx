import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SolutionsShowcase } from "@/components/SolutionsShowcase";

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
      screenshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          imageUrl: true,
        },
      },
    },
  });

  return project;
}

function getFirstFragmentTitle(messages: any[]) {
  const msg = messages.find(m => m.fragment && m.fragment.title && m.fragment.title.trim() !== "");
  return msg?.fragment?.title;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Solution Not Found - Devle",
    };
  }

  const fragmentTitle = getFirstFragmentTitle(project.messages);
  const title = fragmentTitle || project.name;
  const description = `Build a ${title} with our AI site builder. Create a ${title} by chatting with our AI.`;

  return {
    title: `Build a ${title} with our AI site builder - Devle`,
    description,
    openGraph: {
      title: `Build a ${title} with our AI site builder - Devle`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Build a ${title} with our AI site builder - Devle`,
      description,
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
  const fragmentTitle = getFirstFragmentTitle(project.messages);
  const title = fragmentTitle || project.name;
  const fragment = project.messages.find(m => m.fragment)?.fragment;
  const screenshotUrl = project.screenshots[0]?.imageUrl;

  // If no screenshot exists, trigger screenshot generation with better error handling
  if (!screenshotUrl && project.id && fragment?.sandboxUrl) {
    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const url = encodeURIComponent(fragment.sandboxUrl);
        const projectId = encodeURIComponent(project.id);
        
        console.log('Triggering screenshot generation for project:', project.id);
        const response = await fetch(`${baseUrl}/api/screenshot?url=${url}&projectId=${projectId}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Screenshot generated successfully:', result);
        } else {
          const error = await response.text();
          console.error('Screenshot generation failed:', response.status, error);
        }
      } catch (e) {
        console.error('Screenshot trigger failed:', e);
      }
    })();
  }

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
            {screenshotUrl ? (
              <div className="border rounded-lg overflow-hidden mb-4">
                <Image
                  src={screenshotUrl}
                  alt={title + " screenshot"}
                  width={1280}
                  height={720}
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden mb-4">
                <iframe
                  src={fragment.sandboxUrl}
                  className="w-full h-96 border-0"
                  title={fragment.title}
                />
              </div>
            )}
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
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">FAQ</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-create">
                  <AccordionTrigger>How can I create {title}?</AccordionTrigger>
                  <AccordionContent>
                    Just use our AI builder above to generate your {title} instantly.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="best-way">
                  <AccordionTrigger>What is the best way to use {title}?</AccordionTrigger>
                  <AccordionContent>
                    Interact with the AI and provide details to tailor your {title}.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="customize">
                  <AccordionTrigger>Can I customize my {title}?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can further edit and personalize your {title} after creation.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="beginners">
                  <AccordionTrigger>Is {title} suitable for beginners?</AccordionTrigger>
                  <AccordionContent>
                    {title} is designed to be easy for everyone, including beginners.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="share">
                  <AccordionTrigger>How do I share my {title}?</AccordionTrigger>
                  <AccordionContent>
                    You can share your {title} by sending the link or exporting it.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          <SolutionsShowcase />
        </div>
      </div>
    </div>
  );
} 