import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const getScreenshotBySandboxUrl = async (sandboxUrl: string) => {
  return prisma.screenshot.findUnique({ where: { sandboxUrl } });
};

export const createScreenshot = async (sandboxUrl: string, imageUrl: string) => {
  return prisma.screenshot.create({ data: { sandboxUrl, imageUrl } });
};

