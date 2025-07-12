import { NextRequest, NextResponse } from 'next/server';
import { getScreenshotBySandboxUrl, createScreenshot } from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    // Check if we already have a screenshot
    let screenshot = await getScreenshotBySandboxUrl(url);
    if (screenshot) return NextResponse.json({ imageUrl: screenshot.imageUrl });

    // Check if Cloudinary credentials are available
    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary credentials');
      return NextResponse.json({ 
        error: 'Screenshot service not configured',
        details: 'Missing Cloudinary environment variables'
      }, { status: 500 });
    }

    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // Fetch thum.io image
    const thumioUrl = `https://image.thum.io/get/width/1280/crop/720/${url}`;
    console.log('Fetching from thum.io:', thumioUrl);
    
    const thumioRes = await fetch(thumioUrl);
    if (!thumioRes.ok) {
      console.error('thum.io failed:', thumioRes.status, thumioRes.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch screenshot from thum.io',
        details: `Status: ${thumioRes.status}`
      }, { status: 500 });
    }
    
    const buffer = await thumioRes.arrayBuffer();

    // Prepare signed upload
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

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
    
    if (!cloudRes.ok) {
      console.error('Cloudinary upload failed:', cloudRes.status, cloudRes.statusText);
      return NextResponse.json({ 
        error: 'Failed to upload to Cloudinary',
        details: `Status: ${cloudRes.status}`
      }, { status: 500 });
    }
    
    const cloudData = await cloudRes.json();
    console.log('Cloudinary response:', cloudData);
    
    if (!cloudData.secure_url) {
      return NextResponse.json({ 
        error: 'Cloudinary upload failed', 
        details: cloudData 
      }, { status: 500 });
    }

    screenshot = await createScreenshot(url, cloudData.secure_url);
    return NextResponse.json({ imageUrl: screenshot.imageUrl });
    
  } catch (error) {
    console.error('Screenshot API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 