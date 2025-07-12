import { NextRequest, NextResponse } from 'next/server';
import { getScreenshotBySandboxUrl, createScreenshot } from '@/lib/db';
import crypto from 'crypto';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  let screenshot = await getScreenshotBySandboxUrl(url);
  if (screenshot) return NextResponse.json({ imageUrl: screenshot.imageUrl });

  // Fetch thum.io image
  const thumioUrl = `https://image.thum.io/get/width/1280/crop/720/${url}`;
  const thumioRes = await fetch(thumioUrl);
  if (!thumioRes.ok) return NextResponse.json({ error: 'Failed to fetch thum.io' }, { status: 500 });
  const buffer = await thumioRes.arrayBuffer();

  // Prepare signed upload
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([buffer]));
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('format', 'png');

  const cloudRes = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });
  const cloudData = await cloudRes.json();
  console.log('Cloudinary response:', cloudData);
  if (!cloudData.secure_url) return NextResponse.json({ error: 'Cloudinary upload failed', details: cloudData }, { status: 500 });

  screenshot = await createScreenshot(url, cloudData.secure_url);

  return NextResponse.json({ imageUrl: screenshot.imageUrl });
} 