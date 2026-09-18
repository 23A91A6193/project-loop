import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession, requireAuth } from '@/lib/auth';
import { analyzeFeedback } from '@/lib/gemini';

const feedbackInputSchema = z.object({
  content: z.string().min(3, 'Feedback content must be at least 3 characters'),
  channel: z.string().default('PORTAL'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  rating: z.union([z.number(), z.string()]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const sentiment = searchParams.get('sentiment');
  const category = searchParams.get('category');
  const channel = searchParams.get('channel');
  const status = searchParams.get('status');
  const dateRange = searchParams.get('dateRange'); // 7d, 30d, all
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15')));
  const skip = (page - 1) * limit;

  // STRICT TENANT ISOLATION
  const where: any = {
    tenantId: session.tenantId,
  };

  if (sentiment && sentiment !== 'ALL') {
    where.sentiment = sentiment;
  }
  if (category && category !== 'ALL') {
    where.category = category;
  }
  if (channel && channel !== 'ALL') {
    where.channel = channel;
  }
  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (dateRange === '7d') {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  } else if (dateRange === '30d') {
    where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }

  if (search.trim()) {
    where.OR = [
      { content: { contains: search.trim() } },
      { customerName: { contains: search.trim() } },
      { customerEmail: { contains: search.trim() } },
    ];
  }

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({
    feedbacks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

export async function POST(req: NextRequest) {
  let tenantId: string | null = null;
  let callerRole: string = 'ANALYST';

  // Check API Key for external webhook / channel sync
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey },
    });
    if (tenant) {
      tenantId = tenant.id;
      callerRole = 'ADMIN';
    }
  }

  if (!tenantId) {
    const { session, errorResponse } = await requireAuth(['ADMIN', 'ANALYST']);
    if (errorResponse || !session) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    tenantId = session.tenantId;
    callerRole = session.role;
  }

  try {
    const rawBody = await req.json();
    const validated = feedbackInputSchema.parse(rawBody);

    // AI Auto-classification (AI1)
    const aiAnalysis = await analyzeFeedback(validated.content);

    let parsedRating: number | null = null;
    if (validated.rating !== undefined && validated.rating !== null) {
      const num = parseInt(String(validated.rating).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num >= 1 && num <= 5) {
        parsedRating = num;
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        tenantId,
        customerName: validated.customerName || 'Anonymous Customer',
        customerEmail: validated.customerEmail || null,
        channel: validated.channel || 'PORTAL',
        rating: parsedRating,
        content: validated.content.trim(),
        status: 'NEW',
        isAnalyzed: true,
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.sentimentScore,
        sentimentRationale: aiAnalysis.sentimentRationale,
        category: aiAnalysis.category,
        urgencyScore: aiAnalysis.urgencyScore,
        actionSuggestion: aiAnalysis.actionSuggestion,
      },
    });

    // Auto-associate with matching theme
    const matchingTheme = await prisma.theme.findFirst({
      where: {
        tenantId,
        OR: [
          { name: { contains: aiAnalysis.category.replace('_', ' ') } },
          { description: { contains: aiAnalysis.category.replace('_', ' ') } },
        ],
      },
    });

    if (matchingTheme) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: matchingTheme.id,
          confidence: Math.abs(aiAnalysis.sentimentScore) > 0.5 ? 0.92 : 0.80,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation failed' }, { status: 400 });
    }
    console.error('Create feedback error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create feedback' }, { status: 500 });
  }
}
