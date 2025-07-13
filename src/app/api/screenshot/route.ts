import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    const projectId = req.nextUrl.searchParams.get('projectId');
    console.log('Incoming screenshot request:', { url, projectId });
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

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

    // Try multiple screenshot services with fallbacks
    let buffer: Buffer | null = null;
    let screenshotSource = 'unknown';
    
    // First try thum.io
    try {
      const thumioUrl = `https://image.thum.io/get/png/width/1280/crop/720/${url}`;
      console.log('Trying thum.io:', thumioUrl);
      
      const thumioRes = await fetch(thumioUrl, { 
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (thumioRes.ok) {
        buffer = Buffer.from(await thumioRes.arrayBuffer());
        screenshotSource = 'thum.io';
        console.log('Successfully got screenshot from thum.io');
      } else {
        console.error('thum.io failed:', thumioRes.status, thumioRes.statusText);
      }
    } catch (error) {
      console.error('thum.io error:', error);
    }

    // Fallback to urlbox.io if thum.io fails
    if (!buffer) {
      try {
        const urlboxApiKey = process.env.URLBOX_API_KEY;
        const urlboxApiSecret = process.env.URLBOX_API_SECRET;
        
        if (urlboxApiKey && urlboxApiSecret) {
          const urlboxUrl = `https://api.urlbox.io/v1/${urlboxApiKey}/png?url=${encodeURIComponent(url)}&width=1280&height=720&full_page=false`;
          console.log('Trying urlbox.io fallback');
          
          const urlboxRes = await fetch(urlboxUrl, { 
            headers: {
              'Authorization': `Basic ${Buffer.from(`${urlboxApiKey}:${urlboxApiSecret}`).toString('base64')}`
            }
          });
          
          if (urlboxRes.ok) {
            buffer = Buffer.from(await urlboxRes.arrayBuffer());
            screenshotSource = 'urlbox.io';
            console.log('Successfully got screenshot from urlbox.io');
          } else {
            console.error('urlbox.io failed:', urlboxRes.status, urlboxRes.statusText);
          }
        }
      } catch (error) {
        console.error('urlbox.io error:', error);
      }
    }

    // If all screenshot services fail, return error
    if (!buffer) {
      console.error('All screenshot services failed');
      return NextResponse.json({ 
        error: 'Failed to generate screenshot',
        details: 'All screenshot services (thum.io, urlbox.io) failed'
      }, { status: 500 });
    }

    // Prepare signed upload
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureString = `format=png&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = createHash('sha1').update(signatureString).digest('hex');

    // Use native FormData and Blob
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: 'image/png' }), 'screenshot.png');
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('timestamp', timestamp.toString());
    form.append('signature', signature);
    form.append('format', 'png');

    let imageUrl: string | null = null;
    let cloudinaryError: string | null = null;
    // Try Cloudinary upload
    try {
      console.log('Uploading to Cloudinary...');
      const cloudRes = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: form,
        // DO NOT set headers: fetch will set the correct Content-Type for FormData
      });
      if (!cloudRes.ok) {
        const errorText = await cloudRes.text();
        console.error('Cloudinary upload failed:', cloudRes.status, cloudRes.statusText, errorText);
        cloudinaryError = errorText;
        imageUrl = 'FAILED';
      } else {
        const cloudData = await cloudRes.json();
        console.log('Cloudinary response:', cloudData);
        if (!cloudData.secure_url) {
          imageUrl = 'FAILED';
          cloudinaryError = JSON.stringify(cloudData);
        } else {
          imageUrl = cloudData.secure_url;
        }
      }
    } catch (err) {
      console.error('Cloudinary upload threw:', err);
      imageUrl = 'FAILED';
      cloudinaryError = err instanceof Error ? err.message : String(err);
    }

    // Always create a new screenshot record
    const screenshot = await prisma.screenshot.create({
      data: {
        sandboxUrl: url,
        imageUrl: imageUrl!,
        projectId,
      },
    });

    if (imageUrl === 'FAILED') {
      return NextResponse.json({
        error: 'Failed to upload to Cloudinary',
        details: cloudinaryError,
        imageUrl: 'FAILED',
        screenshotSource,
      }, { status: 500 });
    }
    
    console.log(`Screenshot successfully generated and uploaded from ${screenshotSource}`);
    return NextResponse.json({ 
      imageUrl: screenshot.imageUrl,
      screenshotSource,
    });
    
  } catch (error) {
    console.error('Screenshot API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 