import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateVoCReportAI } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reports = await prisma.vocReport.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const timeRange = body.timeRange || 'Last 30 Days';

    // Fetch tenant's feedback
    const feedbacks = await prisma.feedback.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'Cannot generate a report with zero customer feedback records.' },
        { status: 400 }
      );
    }

    const aiReport = await generateVoCReportAI(feedbacks, timeRange);

    const savedReport = await prisma.vocReport.create({
      data: {
        tenantId: session.tenantId,
        title: aiReport.title,
        timeRange: aiReport.timeRange,
        totalFeedbacks: aiReport.totalFeedbacks,
        positiveCount: aiReport.positiveCount,
        negativeCount: aiReport.negativeCount,
        neutralCount: aiReport.neutralCount,
        netSentimentScore: aiReport.netSentimentScore,
        topThemes: JSON.stringify(aiReport.topThemes),
        keyStrengths: JSON.stringify(aiReport.keyStrengths),
        criticalIssues: JSON.stringify(aiReport.criticalIssues),
        executiveSummary: aiReport.executiveSummary,
        actionPlan: aiReport.actionPlan,
        createdBy: `${session.name} via AI Engine`,
      },
    });

    return NextResponse.json({ success: true, report: savedReport });
  } catch (error: any) {
    console.error('Generate VoC report error:', error);
    return NextResponse.json({ error: error.message || 'Report generation failed' }, { status: 500 });
  }
}
