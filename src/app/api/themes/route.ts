import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const themes = await prisma.theme.findMany({
      where: { tenantId: session.tenantId },
      include: {
        feedbacks: {
          include: {
            feedback: true,
          },
        },
      },
    });

    const enrichedThemes = themes.map((theme) => {
      const items = theme.feedbacks.map((f) => f.feedback);
      const totalCount = items.length;

      const positiveCount = items.filter((f) => f.sentiment === 'POSITIVE').length;
      const negativeCount = items.filter((f) => f.sentiment === 'NEGATIVE').length;
      const neutralCount = items.filter((f) => f.sentiment === 'NEUTRAL').length;

      // Spike calculation: volume this week vs previous week
      const countThisWeek = items.filter((f) => new Date(f.createdAt) >= oneWeekAgo).length;
      const countPrevWeek = items.filter(
        (f) => new Date(f.createdAt) >= twoWeeksAgo && new Date(f.createdAt) < oneWeekAgo
      ).length;

      let trendPercentage = 0;
      let isSpiking = false;
      if (countPrevWeek > 0) {
        trendPercentage = Math.round(((countThisWeek - countPrevWeek) / countPrevWeek) * 100);
      } else if (countThisWeek > 0) {
        trendPercentage = 100;
      }

      if (trendPercentage >= 40 && countThisWeek >= 3) {
        isSpiking = true;
      }

      const topQuotes = items.slice(0, 3).map((f) => ({
        id: f.id,
        content: f.content,
        customerName: f.customerName,
        sentiment: f.sentiment,
        createdAt: f.createdAt,
      }));

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        totalCount,
        positiveCount,
        negativeCount,
        neutralCount,
        countThisWeek,
        countPrevWeek,
        trendPercentage,
        isSpiking,
        topQuotes,
      };
    });

    // Sort by volume descending
    enrichedThemes.sort((a, b) => b.totalCount - a.totalCount);

    return NextResponse.json({ themes: enrichedThemes });
  } catch (error: any) {
    console.error('Fetch themes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch themes' }, { status: 500 });
  }
}
