import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ alive: false }, { status: 400 });

  try {
    // Try HEAD first
    const resp = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (resp.ok) return NextResponse.json({ alive: true });
    // Fallback to GET if HEAD fails (some sandboxes may not support HEAD)
    const getResp = await fetch(url, { method: 'GET', cache: 'no-store' });
    return NextResponse.json({ alive: getResp.ok });
  } catch {
    return NextResponse.json({ alive: false });
  }
} 