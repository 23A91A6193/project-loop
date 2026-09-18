import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { analyzeFeedback } from '@/lib/gemini';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAuth(['ADMIN', 'ANALYST']);
  if (errorResponse || !session) {
    return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status, category, urgencyScore, sentiment } = body;

    // Verify tenant ownership
    const feedback = await prisma.feedback.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found in your workspace' }, { status: 404 });
    }

    const updated = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(category && { category }),
        ...(sentiment && { sentiment }),
        ...(urgencyScore !== undefined && { urgencyScore: parseInt(urgencyScore) }),
      },
    });

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

// Manual Re-classify action (AI1 acceptance criteria 4)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAuth(['ADMIN', 'ANALYST']);
  if (errorResponse || !session) {
    return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const feedback = await prisma.feedback.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found in your workspace' }, { status: 404 });
    }

    const ai = await analyzeFeedback(feedback.content);

    const updated = await prisma.feedback.update({
      where: { id: params.id },
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

    return NextResponse.json({ success: true, message: 'Re-classified successfully!', feedback: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Re-classification failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAuth(['ADMIN', 'ANALYST']);
  if (errorResponse || !session) {
    return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const feedback = await prisma.feedback.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found in your workspace' }, { status: 404 });
    }

    await prisma.feedback.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Feedback removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
