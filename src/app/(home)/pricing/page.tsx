"use client";
import Image from "next/image";
import { PricingTable } from "@clerk/nextjs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useCurrentTheme } from "@/hooks/use-current-theme";

import { dark } from "@clerk/themes"

const Page = () => {
  const currentTheme = useCurrentTheme();

  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <section className="space-y-6 pt-[16vh] 2xl:pt-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Devle"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center">Pricing</h1>
        <p className="text-center text-muted-foreground text-sm md:text-base">
          Choose the plan that works best for you.
        </p>
        <PricingTable 
        appearance={{
            baseTheme: currentTheme === "dark" ? dark : undefined,
            elements: {
                pricingTableCard: "border! shadow-none! rounded-lg!"
            }
        }}
        />
      </section>

      <section className="space-y-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mt-2">Everything you need to know about Devle.ai</p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is-devle">
            <AccordionTrigger>What is Devle.ai?</AccordionTrigger>
            <AccordionContent>
              Devle.ai is an AI-powered development platform that creates complete Next.js applications in a sandboxed environment. 
              Simply describe your project, and our AI generates production-ready code with modern UI components, 
              responsive design, and full functionality using Next.js 15.3.3, TypeScript, and Tailwind CSS.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-it-works">
            <AccordionTrigger>How does the AI development work?</AccordionTrigger>
            <AccordionContent>
              Our AI works in a sandboxed Next.js environment with a writable file system. It creates and updates files, 
              installs dependencies via terminal commands, and builds complete applications with realistic features. 
              The AI generates TypeScript components, handles state management, and implements proper React patterns 
              with Shadcn UI components and Tailwind CSS styling.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="what-can-i-build">
            <AccordionTrigger>What types of applications can I build?</AccordionTrigger>
            <AccordionContent>
              Devle.ai can create any type of Next.js application: dashboards, e-commerce sites, SaaS platforms, 
              blogs, portfolios, admin panels, and more. The AI understands complex requirements and builds 
              production-quality features with proper component architecture, state management, and responsive design.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tech-stack">
            <AccordionTrigger>What technology stack does it use?</AccordionTrigger>
            <AccordionContent>
              Devle.ai uses Next.js 15.3.3 with TypeScript, Tailwind CSS for styling, and Shadcn UI components. 
              The AI automatically installs required npm packages, creates proper file structures, and implements 
              modern React patterns with hooks, proper state management, and semantic HTML.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="customization">
            <AccordionTrigger>Can I customize the generated applications?</AccordionTrigger>
            <AccordionContent>
              Yes! The AI creates modular, well-structured code that's easy to modify. You can edit components, 
              add new features, change styling with Tailwind classes, and integrate additional packages. 
              The AI can also help you extend functionality through natural language requests.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pricing">
            <AccordionTrigger>What's included in each pricing plan?</AccordionTrigger>
            <AccordionContent>
              Our plans include different levels of AI generations, project storage, and development features. 
              The free plan lets you try Devle.ai with basic functionality, while paid plans offer unlimited 
              generations, advanced customization options, priority support, and team collaboration tools.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
};

export default Page;
