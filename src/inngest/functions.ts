import { inngest } from "./client";
import { openai, anthropic, createAgent, createTool, createNetwork, type Tool, type Message, createState } from "@inngest/agent-kit";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";

import { prisma } from "@/lib/db";
import FormData from "form-data";
import { createHash } from "crypto";


interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

function categorizeFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('e-commerce') || t.includes('shop') || t.includes('store')) return 'E-Commerce';
  if (t.includes('blog')) return 'Blog';
  if (t.includes('portfolio')) return 'Portfolio';
  if (t.includes('chat') || t.includes('messaging')) return 'Chat';
  if (t.includes('dashboard')) return 'Dashboard';
  if (t.includes('landing')) return 'Landing Page';
  if (t.includes('saas')) return 'SaaS';
  if (t.includes('game')) return 'Game';
  if (t.includes('social')) return 'Social';
  if (t.includes('ai') || t.includes('assistant')) return 'AI';
  return 'Other';
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const project = await prisma.project.findUnique({ where: { id: event.data.projectId } });
    const isPro = event.data.userPlan === 'pro';
    const isPrivate = project?.visibility === 'private';
    const timeoutMs = isPro && isPrivate ? 60_000 * 30 : 60_000 * 60 * 3;
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("devle-ai-project-2");
      await sandbox.setTimeout(timeoutMs);
      return sandbox.sandboxId;
    });

    const previousMessages = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];

      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        })
      }

      return formattedMessages.reverse();
    });

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},

      },
      {
        messages: previousMessages,
      }
      );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ 
        model: "gpt-4.1" ,
        
        defaultParameters: {
            temperature: 0.1,
            
        }
    }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (e) {
                console.error("Error running command:", e);
                throw e;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network?.state?.data?.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                console.error("Error updating files:", e);
                throw e;
              }
            });
            if (typeof newFiles === "object") {
                network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
            name: "readFiles",
            description: "Read files from the sandbox",
            parameters: z.object({
                files: z.array(z.string()),
            }),

          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
                try {
                    const sandbox = await getSandbox(sandboxId);
                    const contents = [];
                    for (const file of files) {
                        const content = await sandbox.files.read(file);
                        contents.push({ path: file, content });
                    }
                    return JSON.stringify(contents);
                } catch (error) {
                    console.error("Error reading files:", error);
                    throw error;
                }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
            const lastAssistantMessageText = lastAssistantTextMessageContent(result);

            if (lastAssistantMessageText && network) {
                if (lastAssistantMessageText.includes("<task_summary>")) {
                    network.state.data.summary = lastAssistantMessageText
                }
            }
            return result;

        },

      },
    });

    const network = createNetwork<AgentState>({
        name: "coding-agent-network",
        agents: [codeAgent],
        maxIter: 15,
        defaultState: state,
        router: async ({ network }) => {
            const summary = network.state.data.summary;

            if (summary) {
                return;
            }
            return codeAgent;
        },
    });
 
    const result = await network.run(event.data.value, { state: state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({ 
        model: "gpt-4o" ,
    }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({ 
        model: "gpt-4o" ,
    }),
    });

    const { 
      output: fragmentTitleOutput 
    } = await fragmentTitleGenerator.run(result.state.data.summary)
    const { 
      output: responseOutput 
    } = await responseGenerator.run(result.state.data.summary)


    const generateFragmentTitle = () => {
      if (fragmentTitleOutput[0].type !== "text") {
        return "Fragment";
      }

      if (Array.isArray(fragmentTitleOutput[0].content)) {
        return fragmentTitleOutput[0].content.map((txt) => txt).join("")
      } else {
        return fragmentTitleOutput[0].content
      }

    }


        const generateResponse = () => {
      if (responseOutput[0].type !== "text") {
        return "Here you go";
      }

      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((txt) => txt).join("")
      } else {
        return responseOutput[0].content
      }

    }

    const isError = 
    !result.state.data.summary ||
    Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {

      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      // Auto-categorize project based on fragment title
      const fragmentTitle = generateFragmentTitle();
      const category = categorizeFromTitle(fragmentTitle);
      await prisma.project.update({
        where: { id: event.data.projectId },
        data: { category },
      });

      const message = await prisma.message.create({
        data: {
            projectId: event.data.projectId,
          content: generateResponse(),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: fragmentTitle,
              files: result.state.data.files,
            }
          }
        },
      });

      return message;
    });

    // Trigger generate-solution-page function if project is public
    const projectVisibility = await prisma.project.findUnique({
      where: { id: event.data.projectId },
      select: { visibility: true }
    });

    if (projectVisibility?.visibility === 'public') {
      await inngest.send({
        name: "code-agent/run.completed",
        data: {
          projectId: event.data.projectId,
        },
      });
    }

    return { 
        url: sandboxUrl,
        title: "Fragment",
        files: result.state.data.files,
        summary: result.state.data.summary,
    };
  }
);

export const generateSolutionPageFunction = inngest.createFunction(
  { id: "generate-solution-page" },
  { event: "code-agent/run.completed" },
  async ({ event, step }) => {
    try {
      console.log('🔍 Inngest function triggered:', event);
      
      const project = await step.run("get-project", async () => {
        console.log('🔍 Looking for project:', event.data.projectId);
        const foundProject = await prisma.project.findUnique({
          where: { id: event.data.projectId },
          select: {
            id: true,
            name: true,
            visibility: true,
            messages: {
              take: 1,
              orderBy: { createdAt: "asc" },
              select: { content: true },
            },
          },
        });
        console.log('🔍 Found project:', foundProject);
        return foundProject;
      });

    if (!project || project.visibility !== "public") {
      return { message: "Project not found or not public" };
    }

    // Generate slug from the first message content
    const firstMessage = project.messages[0]?.content || "";
    const slug = await step.run("generate-slug", async () => {
      // Create a URL-friendly slug from the message content
      const baseSlug = firstMessage
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .substring(0, 50);

      // Ensure uniqueness by adding project ID suffix if needed
      const existingProject = await prisma.project.findFirst({
        where: { slug: baseSlug },
      });

      if (existingProject && existingProject.id !== project.id) {
        return `${baseSlug}-${project.id.substring(0, 8)}`;
      }

      return baseSlug;
    });

    // Update project with slug
    await step.run("update-project-slug", async () => {
      await prisma.project.update({
        where: { id: project.id },
        data: { slug },
      });
    });

    // Fetch fragment title and sandboxUrl from the latest fragment
    const projectWithFragment = await prisma.project.findUnique({
      where: { id: project.id },
      select: {
        messages: {
          orderBy: { createdAt: "desc" },
          select: {
            fragment: {
              select: { title: true, sandboxUrl: true },
            },
          },
        },
      },
    });
    const fragment = projectWithFragment?.messages.find(m => m.fragment);
    const fragmentTitle = fragment?.fragment?.title || "";
    const sandboxUrl = fragment?.fragment?.sandboxUrl;

    // Use OpenAI to categorize based on the user's prompt
    const categoryAgent = createAgent({
      name: "category-agent",
      description: "Categorizes a project prompt into a solution category.",
      system: `You are an expert at classifying app types. Given this prompt of the user: , output only the best matching category from this list, and output ONLY the category name, nothing else:
E-Commerce
Blog
Portfolio
Chat
Dashboard
Landing Page
SaaS
Game
Social
AI
Music Player
File Manager
YouTube
Netflix
Property Listings
Image Upload/OCR
Job Portal
Other
If unsure, output exactly: Other.`,
      model: openai({ model: "gpt-4o" }),
    });
    const { output: categoryOutput } = await categoryAgent.run(firstMessage);
    let aiCategory = "Other";
    if (categoryOutput && categoryOutput[0]?.type === "text") {
      aiCategory = Array.isArray(categoryOutput[0].content)
        ? categoryOutput[0].content.join("")
        : categoryOutput[0].content;
      aiCategory = aiCategory.split("\n")[0].trim();
    }
    await prisma.project.update({
      where: { id: project.id },
      data: { category: aiCategory },
    });

    // Wait 10 seconds for AI/sandbox to be ready
    await step.sleep("wait-for-screenshot", 10 * 1000);

    // Call the screenshot API route with retries and proper error handling
    if (sandboxUrl) {
      await step.run("generate-screenshot", async () => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const url = encodeURIComponent(sandboxUrl);
        const projectId = encodeURIComponent(project.id);
        
        // Try up to 3 times with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Screenshot attempt ${attempt} for project ${project.id}`);
            const response = await fetch(`${baseUrl}/api/screenshot?url=${url}&projectId=${projectId}`);
            
            if (response.ok) {
              const result = await response.json();
              console.log(`Screenshot generated successfully:`, result);
              return result;
            } else {
              const error = await response.text();
              console.error(`Screenshot attempt ${attempt} failed:`, response.status, error);
              
              if (attempt < 3) {
                // Wait longer between retries
                await new Promise(resolve => setTimeout(resolve, 30 * 1000 * attempt));
              }
            }
          } catch (error) {
            console.error(`Screenshot attempt ${attempt} threw error:`, error);
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 30 * 1000 * attempt));
            }
          }
        }
        
        console.error(`All screenshot attempts failed for project ${project.id}`);
        return { error: 'Screenshot generation failed after 3 attempts' };
      });
    }

    // Check if the latest assistant message is an error
    const lastAssistantMessage = await prisma.message.findFirst({
      where: {
        projectId: project.id,
        role: 'ASSISTANT',
      },
      orderBy: { createdAt: 'desc' },
      select: { type: true },
    });
    if (lastAssistantMessage?.type === 'ERROR') {
      return { message: 'Not creating solution page: sandbox result is an error.' };
    }

    // Check for duplicate fragment title in other public projects that have a solution page (slug is not null)
    if (fragmentTitle) {
      const duplicate = await prisma.project.findFirst({
        where: {
          id: { not: project.id },
          visibility: 'public',
          slug: { not: null },
          messages: {
            some: {
              fragment: {
                title: fragmentTitle,
              },
            },
          },
        },
      });
      if (duplicate) {
        return { message: 'Not creating solution page: duplicate fragment title.' };
      }
    }

    return {
      projectId: project.id,
      slug,
      message: `Solution page generated for: ${firstMessage}`,
    };
    } catch (error) {
      console.error('❌ Error in generateSolutionPageFunction:', error);
      throw error;
    }
  }
);