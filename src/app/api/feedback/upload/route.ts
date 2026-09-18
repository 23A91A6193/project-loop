import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { analyzeFeedback } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await requireAuth(['ADMIN', 'ANALYST']);
  if (errorResponse || !session) {
    return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows, autoAnalyze } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Valid rows array is required' }, { status: 400 });
    }

    let insertedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const content = (row.content || row.feedback || row.text || row.comment || '').trim();

      if (!content || content.length < 3) {
        failedCount++;
        errors.push(`Row ${i + 1}: feedback content is empty or under 3 characters.`);
        continue;
      }

      let aiData: any = { isAnalyzed: false };

      if (autoAnalyze) {
        try {
          const ai = await analyzeFeedback(content);
          aiData = {
            isAnalyzed: true,
            sentiment: ai.sentiment,
            sentimentScore: ai.sentimentScore,
            sentimentRationale: ai.sentimentRationale,
            category: ai.category,
            urgencyScore: ai.urgencyScore,
            actionSuggestion: ai.actionSuggestion,
          };
        } catch {
          // fallback gracefully
        }
      }

      try {
        let parsedRating: number | null = null;
        if (row.rating !== undefined && row.rating !== null && String(row.rating).trim() !== '') {
          const num = parseInt(String(row.rating).replace(/\D/g, ''), 10);
          if (!isNaN(num) && num >= 1 && num <= 5) {
            parsedRating = num;
          }
        }

        await prisma.feedback.create({
          data: {
            tenantId: session.tenantId,
            customerName: row.customerName || row.name || row.customer || 'CSV Customer',
            customerEmail: row.customerEmail || row.email || null,
            channel: (row.channel || 'CSV_IMPORT').toUpperCase().replace(/\s+/g, '_'),
            rating: parsedRating,
            content,
            status: 'NEW',
            ...aiData,
          },
        });
        insertedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`Row ${i + 1}: ${err.message || 'Database insert error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      failedCount,
      totalProcessed: rows.length,
      errors: errors.slice(0, 5), // return first few errors if any
      message: `Successfully imported ${insertedCount} feedback entries (${failedCount} failed).`,
    });
  } catch (error: any) {
    console.error('CSV Upload error:', error);
    return NextResponse.json({ error: error.message || 'CSV Ingestion failed' }, { status: 500 });
  }
}
