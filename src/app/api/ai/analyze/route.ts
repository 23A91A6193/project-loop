import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { analyzeFeedback } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { feedbackId } = body;

    if (feedbackId) {
      // Analyze single feedback
      const feedback = await prisma.feedback.findFirst({
        where: { id: feedbackId, tenantId: session.tenantId },
      });

      if (!feedback) {
        return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
      }

      const ai = await analyzeFeedback(feedback.content);
      const updated = await prisma.feedback.update({
        where: { id: feedback.id },
        data: {
          isAnalyzed: true,
          sentiment: ai.sentiment,
          sentimentScore: ai.sentimentScore,
          sentimentRationale: ai.sentimentRationale,
          category: ai.category,
          urgencyScore: ai.urgencyScore,
          actionSuggestion: ai.actionSuggestion,
        },
      });

      return NextResponse.json({ success: true, analyzedCount: 1, feedback: updated });
    }

    // Batch analyze all unanalyzed feedbacks for this tenant
    const unanalyzed = await prisma.feedback.findMany({
      where: {
        tenantId: session.tenantId,
        isAnalyzed: false,
      },
      take: 20, // process batch of up to 20 at a time
    });

    if (unanalyzed.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All feedbacks are already analyzed!',
        analyzedCount: 0,
      });
    }

    let count = 0;
    for (const item of unanalyzed) {
      const ai = await analyzeFeedback(item.content);
      await prisma.feedback.update({
        where: { id: item.id },
        data: {
          isAnalyzed: true,
          sentiment: ai.sentiment,
          sentimentScore: ai.sentimentScore,
          sentimentRationale: ai.sentimentRationale,
          category: ai.category,
          urgencyScore: ai.urgencyScore,
          actionSuggestion: ai.actionSuggestion,
        },
      });
      count++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${count} feedback items using AI!`,
      analyzedCount: count,
    });
  } catch (error: any) {
    console.error('Batch analyze error:', error);
    return NextResponse.json({ error: error.message || 'Batch AI analysis failed' }, { status: 500 });
  }
}
