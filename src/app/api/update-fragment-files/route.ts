import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { fragmentId, files } = await req.json();
    
    if (!fragmentId || !files) {
      return NextResponse.json({ error: "Missing fragmentId or files" }, { status: 400 });
    }

    await prisma.fragment.update({
      where: { id: fragmentId },
      data: { files },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 