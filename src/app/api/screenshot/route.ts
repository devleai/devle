import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    const projectId = req.nextUrl.searchParams.get('projectId');
    
    console.log('Screenshot API called with:', { url, projectId });
    
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    // Check Cloudinary credentials
    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

    console.log('Cloudinary credentials check:', {
      hasCloudName: !!CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!CLOUDINARY_API_KEY,
      hasApiSecret: !!CLOUDINARY_API_SECRET
    });

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Screenshot service not configured' }, { status: 500 });
    }

    // Generate thum.io URL
    const thumioUrl = `https://image.thum.io/get/auth/74672-defeefef/png/width/1280/crop/720/${url}`;

    // Wait 5 seconds for the page to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Upload to Cloudinary using the thum.io URL
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create proper signature for Cloudinary
    const paramsToSign = {
      timestamp: timestamp.toString(),
      format: 'png'
    };
    
    // Sort parameters alphabetically and create signature string
    const signatureParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
      .join('&') + CLOUDINARY_API_SECRET;
    
    const signature = createHash('sha1').update(signatureParams).digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const params = new URLSearchParams({
      file: thumioUrl,
      api_key: CLOUDINARY_API_KEY,
      timestamp: timestamp.toString(),
      signature,
      format: 'png'
    });

    const cloudRes = await fetch(`${uploadUrl}?${params}`, {
      method: 'POST',
    });

    if (!cloudRes.ok) {
      const errorText = await cloudRes.text();
      console.error('Cloudinary upload failed:', {
        status: cloudRes.status,
        statusText: cloudRes.statusText,
        error: errorText,
        url: uploadUrl,
        params: Object.fromEntries(params.entries())
      });
      return NextResponse.json({ 
        error: 'Failed to upload to Cloudinary',
        details: errorText
      }, { status: 500 });
    }

    const cloudData = await cloudRes.json();
    const imageUrl = cloudData.secure_url;

    // Save to database
    await prisma.screenshot.create({
      data: {
        sandboxUrl: url,
        imageUrl,
        projectId,
      },
    });

    return NextResponse.json({ imageUrl });
    
  } catch (error) {
    console.error('Screenshot API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 