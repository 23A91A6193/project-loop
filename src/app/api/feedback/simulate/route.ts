import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { analyzeFeedback } from '@/lib/gemini';

const simulatedChannels = {
  ZENDESK: [
    { name: 'Kavita Iyer', email: 'kavita.i@zenfin.com', channel: 'SUPPORT_TICKET', rating: 2, content: 'Urgent: SAML SSO redirect loop occurs when logging in from Chrome incognito tab.' },
    { name: 'Derek Shaw', email: 'derek@stratuslabs.io', channel: 'SUPPORT_TICKET', rating: 1, content: '504 Gateway Timeout during CSV export on data over 8,000 rows. Need this for audit.' },
    { name: 'Mona Chen', email: 'mona@chenconsulting.com', channel: 'SUPPORT_TICKET', rating: 5, content: 'Technical support engineer answered our webhook question in 5 minutes with working code. Amazing!' },
  ],
  APP_STORE: [
    { name: 'David Miller', email: 'dmiller@iosuser.com', channel: 'APP_STORE', rating: 1, content: 'App crashes on launch after v2.4.1 update on iOS 17.5. Please fix ASAP!' },
    { name: 'Aarav Gupta', email: 'aarav@mobilefan.org', channel: 'PLAY_STORE', rating: 5, content: 'Dark mode UI is sleek, fast, and easy on the eyes. Outstanding update.' },
    { name: 'Sara Lind', email: 'slind@nordicapp.se', channel: 'APP_STORE', rating: 4, content: 'Offline mode saves drafts nicely, but push notifications are occasionally delayed by 20 mins.' },
  ],
  G2_COMMUNITY: [
    { name: 'Rohan Deshmukh', email: 'rohan.d@productleader.co', channel: 'COMMUNITY', rating: 5, content: 'Loop turns customer complaints into actionable roadmap tickets in seconds. Game changer for PMs.' },
    { name: 'Elena Petrova', email: 'elena@ecomscale.ru', channel: 'COMMUNITY', rating: 3, content: 'Would love an automated Slack notification whenever an urgent negative bug is submitted.' },
    { name: 'Tom Higgins', email: 'thiggins@saasventure.com', channel: 'COMMUNITY', rating: 2, content: 'Invoicing page lacks tax breakdown for international clients paying in EUR or GBP.' },
  ],
};

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await requireAuth(['ADMIN', 'ANALYST']);
  if (errorResponse || !session) {
    return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const channelKey = (body.channel || 'ZENDESK') as keyof typeof simulatedChannels;
    const pool = simulatedChannels[channelKey] || simulatedChannels.ZENDESK;

    const importedItems: any[] = [];

    for (const item of pool) {
      const ai = await analyzeFeedback(item.content);

      const created = await prisma.feedback.create({
        data: {
          tenantId: session.tenantId,
          customerName: item.name,
          customerEmail: item.email,
          channel: item.channel,
          rating: item.rating,
          content: item.content,
          status: 'NEW',
          isAnalyzed: true,
          sentiment: ai.sentiment,
          sentimentScore: ai.sentimentScore,
          sentimentRationale: ai.sentimentRationale,
          category: ai.category,
          urgencyScore: ai.urgencyScore,
          actionSuggestion: ai.actionSuggestion,
        },
      });

      // Link to matching theme if any
      const theme = await prisma.theme.findFirst({
        where: {
          tenantId: session.tenantId,
          OR: [
            { name: { contains: ai.category.replace('_', ' ') } },
            { description: { contains: ai.category.replace('_', ' ') } },
          ],
        },
      });

      if (theme) {
        await prisma.feedbackTheme.create({
          data: {
            feedbackId: created.id,
            themeId: theme.id,
            confidence: 0.9,
          },
        }).catch(() => {});
      }

      importedItems.push(created);
    }

    return NextResponse.json({
      success: true,
      channel: channelKey,
      count: importedItems.length,
      message: `Simulated sync from ${channelKey}: Ingested and AI-classified ${importedItems.length} live records!`,
      items: importedItems,
    });
  } catch (error: any) {
    console.error('Channel simulation error:', error);
    return NextResponse.json({ error: error.message || 'Simulation failed' }, { status: 500 });
  }
}
