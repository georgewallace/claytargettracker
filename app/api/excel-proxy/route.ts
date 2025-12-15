import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to download Excel file and bypass CORS
export async function GET(request: NextRequest) {
  try {
    // Use OneDrive API endpoint for direct binary download
    const excelUrl = process.env.NEXT_PUBLIC_EXCEL_DOWNLOAD_URL ||
      "https://api.onedrive.com/v1.0/shares/u!aHR0cHM6Ly8xZHJ2Lm1zL3gvYy9lMDA2OTgxNzI0MjA3MTlhL0lRQ0tSQnhRYV93bVRwTkNkNzB4VUZ2MEFSamFmSGNka2ZDd3RrTktvVWlyS25r/root/content";

    // Fetch the Excel file server-side with browser-like headers (bypasses CORS)
    const response = await fetch(excelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`OneDrive fetch failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to download Excel file: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Check the content type to ensure we got an Excel file
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    console.log('Response URL:', response.url);

    // If we got HTML instead of Excel, OneDrive is showing a preview page
    if (contentType?.includes('text/html')) {
      console.error('Received HTML instead of Excel file. URL might need adjustment.');
      const htmlContent = await response.text();
      console.log('HTML preview (first 500 chars):', htmlContent.substring(0, 500));
      return NextResponse.json(
        { error: 'OneDrive returned an HTML page instead of the Excel file. Please check if the share link allows direct downloads.' },
        { status: 400 }
      );
    }

    // Get the Excel file as a buffer
    const arrayBuffer = await response.arrayBuffer();
    console.log('Successfully fetched Excel file, size:', arrayBuffer.byteLength, 'bytes');

    // Return the Excel file with proper headers and 5-minute cache
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="scores.xlsx"',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error: any) {
    console.error('Excel proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download Excel file' },
      { status: 500 }
    );
  }
}
