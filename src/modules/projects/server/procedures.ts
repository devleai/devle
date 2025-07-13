import { protectedProcedure, createTRPCRouter, baseProcedure } from '@/trpc/init';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { inngest } from '@/inngest/client';
import { generateSlug } from "random-word-slugs";
import { TRPCError } from '@trpc/server';
import { consumeCredits } from '@/lib/usage';
import { subHours } from 'date-fns';

// Simple similarity calculation using Jaccard similarity
function calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

export const projectsRouter = createTRPCRouter({
    
    
    getOne: protectedProcedure
    .input(z.object({
        id: z.string().min(1, { message: "Id is required" })
    }))
    .query(async ({ input, ctx }) => {
        
        const existingProject = await prisma.project.findUnique({
            where: {
                id: input.id,
                userId: ctx.auth.userId,
            },
        });

        if (!existingProject) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }

        return existingProject;
    }),

    
    getMany: protectedProcedure
    .query(async ({ ctx }) => {
        const projects = await prisma.project.findMany({
            where: {
                userId: ctx.auth.userId,
            },
            orderBy: {
                createdAt: 'desc',
            },

        });
        return projects;
    }),

    create: protectedProcedure
    .input(
        z.object({
            value: z.string()
            .min(1, { message: 'Prompt cannot be empty' })
            .max(10000, { message: 'Prompt is too long' }),
            visibility: z.enum(["public", "private"]).default("public"),
        }),
    )
    .mutation(async ({ input, ctx }) => {


                try {
                await consumeCredits();
        
                } catch (error) {
                    if (error instanceof Error) {
                        throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong" });
                    } else {
                        throw new TRPCError({
                            code: "TOO_MANY_REQUESTS",
                            message: "You have run out of credits"
                        });
                    }
                }
        const createdProject = await prisma.project.create({
            data: {
                userId: ctx.auth.userId,
                name: generateSlug(2, {
                    format: "kebab",
                }),
                visibility: input.visibility,
                messages: {
                    create: {
                            content: input.value,
                            role: "USER",
                            type: "RESULT",
                    }
                }
            }
        });


        await inngest.send({
              name: "code-agent/run",
              data: {
                value: input.value,
                projectId: createdProject.id,
              },
            });

        // Trigger solution page generation for public projects
        if (input.visibility === "public") {
          console.log('🚀 Sending public project event for:', createdProject.id);
          await inngest.send({
            name: "project/public-created",
            data: {
              projectId: createdProject.id,
            },
          });
          console.log('✅ Public project event sent');
        }

        return createdProject;
    }),

updateVisibility: protectedProcedure
    .input(z.object({
        projectId: z.string(),
        visibility: z.enum(["public", "private"])
    }))
    .mutation(async ({ input, ctx }) => {

        await prisma.project.update({
            where: { id: input.projectId, userId: ctx.auth.userId },
            data: { visibility: input.visibility }
        });

        // Trigger solution page generation if project becomes public
        if (input.visibility === "public") {
          await inngest.send({
            name: "project/public-created",
            data: {
              projectId: input.projectId,
            },
          });
        }

        return true;
    }),

    getCommunityFragments: baseProcedure.query(async () => {
        const fragments = await prisma.fragment.findMany({
            where: {
                sandboxUrl: { not: "" },
                title: { not: "" },
                message: {
                    project: { visibility: "public" }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: {
                id: true,
                sandboxUrl: true,
                title: true,
                createdAt: true,
            },
        });
        console.log('Found fragments:', fragments);
        return fragments;
    }),

});