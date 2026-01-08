import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// POST: Import scores from Excel file
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // File size validation (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum file size is 10MB.' },
        { status: 400 }
      );
    }

    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get the first sheet (or specified sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return NextResponse.json(
        { error: `Sheet "${sheetName}" not found in workbook` },
        { status: 400 }
      );
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    });

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in Excel file' },
        { status: 400 }
      );
    }

    // Clear existing imported scores
    await prisma.importedScore.deleteMany({});

    // Parse and insert scores
    const scores = jsonData.map((row: any) => ({
      shooter: String(row.Shooter || ''),
      team: String(row.Team || ''),
      gender: String(row.Gender || ''),
      division: String(row.Division || ''),
      discipline: String(row.Discipline || ''),
      round: parseInt(row.Round) || 0,
      targetsThrown: parseInt(row.TargetsThrown) || 0,
      targetsHit: parseInt(row.TargetsHit) || 0,
      stationBreakdown: row.StationBreakdown ? String(row.StationBreakdown) : null,
      field: row.Field ? String(row.Field) : null,
      time: row.Time ? String(row.Time) : null,
      notes: row.Notes ? String(row.Notes) : null,
      uploadedBy: user.id,
    }));

    // Insert all scores
    const result = await prisma.importedScore.createMany({
      data: scores,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully imported ${result.count} scores`,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import scores' },
      { status: 500 }
    );
  }
}

// DELETE: Clear all imported scores
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth();
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Delete all imported scores
    const result = await prisma.importedScore.deleteMany({});

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} scores`,
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete scores' },
      { status: 500 }
    );
  }
}
