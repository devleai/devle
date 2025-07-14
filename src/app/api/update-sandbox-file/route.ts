import { NextRequest, NextResponse } from "next/server";
import { getSandbox } from "@/inngest/utils";

export async function POST(req: NextRequest) {
  try {
    const { path, content, sandboxId } = await req.json();
    if (!path || !sandboxId) {
      return NextResponse.json({ error: "Missing path or sandboxId" }, { status: 400 });
    }
    const sandbox = await getSandbox(sandboxId);
    await sandbox.files.write(path, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 