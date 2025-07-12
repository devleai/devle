import { inngest } from "./client";
import { openai, anthropic, createAgent, createTool, createNetwork, type Tool, type Message, createState } from "@inngest/agent-kit";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";

import { prisma } from "@/lib/db";


interface AgentState {
  summary: string;
  files: { [path: string]: string };
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


      const message = await prisma.message.create({
        data: {
            projectId: event.data.projectId,
          content: generateResponse(),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            }
          }
        },
      });

      return message;
    });

    // Save sandbox URL to database for public projects (outside of save-result step)
    if (!isError && project?.visibility === 'public') {
      await step.run("save-sandbox-url", async () => {
        try {
          console.log('Saving sandbox URL for public project:', sandboxUrl);
          
          // Check if we already have a screenshot for this URL
          const { getScreenshotBySandboxUrl } = await import('@/lib/db');
          const existingScreenshot = await getScreenshotBySandboxUrl(sandboxUrl);
          
          if (!existingScreenshot) {
            // Try to capture screenshot if Cloudinary credentials are available
            const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
            const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
            const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

            if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
              try {
                console.log('Attempting to capture screenshot...');
                
                const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

                // Fetch thum.io image
                const thumioUrl = `https://image.thum.io/get/width/1280/crop/720/${sandboxUrl}`;
                console.log('Fetching from thum.io:', thumioUrl);
                
                const thumioRes = await fetch(thumioUrl);
                if (thumioRes.ok) {
                  const buffer = await thumioRes.arrayBuffer();

                  // Prepare signed upload
                  const timestamp = Math.floor(Date.now() / 1000);
                  const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
                  const signature = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signatureString))
                    .then(buffer => Array.from(new Uint8Array(buffer))
                      .map(b => b.toString(16).padStart(2, '0'))
                      .join(''));

                  const formData = new FormData();
                  formData.append('file', new Blob([buffer], { type: 'image/png' }));
                  formData.append('api_key', CLOUDINARY_API_KEY);
                  formData.append('timestamp', timestamp.toString());
                  formData.append('signature', signature);
                  formData.append('format', 'png');

                  console.log('Uploading to Cloudinary...');
                  const cloudRes = await fetch(CLOUDINARY_UPLOAD_URL, {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    console.log('Cloudinary response:', cloudData);
                    
                    if (cloudData.secure_url) {
                      const { createScreenshot } = await import('@/lib/db');
                      await createScreenshot(sandboxUrl, cloudData.secure_url);
                      console.log('Screenshot saved to database:', cloudData.secure_url);
                      return;
                    }
                  }
                }
              } catch (error) {
                console.error('Screenshot capture failed:', error);
              }
            }
            
            // If screenshot capture failed or credentials missing, save with placeholder
            console.log('Saving sandbox URL without screenshot');
            const { createScreenshot } = await import('@/lib/db');
            await createScreenshot(sandboxUrl, 'https://via.placeholder.com/1280x720/cccccc/666666?text=Project+Preview');
            console.log('Placeholder screenshot saved to database');
          }
        } catch (error) {
          console.error('Failed to save sandbox URL:', error);
        }
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