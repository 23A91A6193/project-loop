import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { askFeedbackAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { question } = await req.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Fetch tenant's feedbacks as context
    const feedbacks = await prisma.feedback.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({
        answer: 'There is currently no customer feedback loaded into your organization to query. Please add or import some feedback first!',
        relatedQuotes: [],
      });
    }

    const result = await askFeedbackAI(question.trim(), feedbacks);

    return NextResponse.json({
      success: true,
      answer: result.answer,
      relatedQuotes: result.relatedQuotes,
      feedbackCountQueried: feedbacks.length,
    });
  } catch (error: any) {
    console.error('Ask AI error:', error);
    return NextResponse.json({ error: error.message || 'AI Question Answering failed' }, { status: 500 });
  }
}
