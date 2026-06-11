import { NextRequest, NextResponse } from 'next/server';
import { validatePlatformPermutations } from '@/lib/validator';

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'title is required' },
        { status: 400 }
      );
    }

    console.log(`[API Resolve] Initiating parallel url validation for title: "${title}"`);

    const validatedUrls = await validatePlatformPermutations(title);

    console.log(`[API Resolve] Validation results for "${title}":`, validatedUrls);

    // Set Cache-Control header to cache responses on CDNs/intermediaries
    const response = NextResponse.json({
      success: true,
      urls: validatedUrls
    });
    
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return response;
  } catch (error: any) {
    console.error('[API Resolve] Validation route error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
