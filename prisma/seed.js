const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Project LOOP database with corporate-grade multi-tenant data...');

  // 1. Create Demo Workspace (Tenant)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-cloud' },
    update: {
      name: 'Acme Cloud Technologies',
    },
    create: {
      name: 'Acme Cloud Technologies',
      slug: 'acme-cloud',
      plan: 'ENTERPRISE',
      apiKey: 'loop_live_acme_secret_998877',
    },
  });

  console.log('Tenant/Workspace created:', tenant.name, `(${tenant.id})`);

  // 2. Create 3 Users for RBAC (Admin, Analyst, Viewer)
  const users = [
    {
      email: 'admin@acme.com',
      name: 'M. Ranjith Kumar (Lead Dev & Admin)',
      passwordHash: 'password123',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
    {
      email: 'analyst@acme.com',
      name: 'M. Renuka Bindu (Co-Dev & Analyst)',
      passwordHash: 'password123',
      role: 'ANALYST',
      tenantId: tenant.id,
    },
    {
      email: 'viewer@acme.com',
      name: 'Alex Wong (Viewer)',
      passwordHash: 'password123',
      role: 'VIEWER',
      tenantId: tenant.id,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, passwordHash: u.passwordHash, tenantId: u.tenantId },
      create: u,
    });
  }
  console.log('3 RBAC demo users seeded: Admin, Analyst, Viewer (password: password123)');

  // 3. Clear existing data for fresh seed
  await prisma.feedbackTheme.deleteMany({});
  await prisma.theme.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.feedback.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.vocReport.deleteMany({ where: { tenantId: tenant.id } });

  // 4. Create Core Themes
  const themesData = [
    { name: 'Mobile App Stability', description: 'Crashes, freezes, and launch bugs on iOS and Android devices', color: 'rose' },
    { name: 'Billing & Subscriptions', description: 'Invoice downloads, payment gateways, pricing transparency, double billing', color: 'amber' },
    { name: 'Performance & Latency', description: 'Page load timeouts, slow CSV queries, backend latency spikes', color: 'orange' },
    { name: 'Enterprise SSO & Security', description: 'Google / Okta SAML SSO, 2FA, RBAC permission roles', color: 'blue' },
    { name: 'UI/UX & Dark Mode', description: 'Visual design, navigation ergonomics, readability, typography', color: 'purple' },
    { name: 'CSV & API Integrations', description: 'Data export capabilities, REST API endpoints, webhooks', color: 'emerald' },
    { name: 'Customer Support Quality', description: 'Help desk response times, technical support engineer clarity', color: 'teal' },
  ];

  const themeMap = {};
  for (const t of themesData) {
    const created = await prisma.theme.create({
      data: {
        tenantId: tenant.id,
        name: t.name,
        description: t.description,
        color: t.color,
      },
    });
    themeMap[t.name] = created.id;
  }
  console.log('Created 7 core themes.');

  // 5. Seed 130 realistic feedback items across various channels, sentiments, dates, ratings
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const rawFeedbackPool = [
    // Mobile App Stability
    {
      channel: 'PLAY_STORE',
      rating: 1,
      name: 'Vikram Mehta',
      email: 'vikram.m@techreach.in',
      content: 'App crashes immediately on launch after the v2.4.1 update on Android 14. Cannot even reach the login screen!',
      sentiment: 'NEGATIVE',
      score: -0.92,
      category: 'BUG',
      urgency: 5,
      theme: 'Mobile App Stability',
      action: 'Ship hotfix v2.4.2 to resolve Android 14 crash on splash screen.',
      rationale: 'Severe blocker: 100% crash rate on Android 14 startup.',
      daysAgo: 1,
      status: 'NEW',
    },
    {
      channel: 'APP_STORE',
      rating: 1,
      name: 'Sarah Jenkins',
      email: 'sjenkins@meridian.org',
      content: 'Constant freezing whenever attempting to upload camera images on iOS 17. Completely unusable for our field team.',
      sentiment: 'NEGATIVE',
      score: -0.88,
      category: 'BUG',
      urgency: 5,
      theme: 'Mobile App Stability',
      action: 'Inspect image buffer memory leak in iOS native camera wrapper.',
      rationale: 'Fatal memory crash during mobile image attachment.',
      daysAgo: 2,
      status: 'REVIEWED',
    },
    {
      channel: 'SUPPORT_TICKET',
      rating: 2,
      name: 'Carlos Mendez',
      email: 'cmendez@deliverfast.co',
      content: 'Push notifications are delayed by 45 minutes on the mobile app, making real-time delivery dispatches miss deadlines.',
      sentiment: 'NEGATIVE',
      score: -0.74,
      category: 'BUG',
      urgency: 4,
      theme: 'Mobile App Stability',
      action: 'Reconfigure FCM/APNS background payload priority settings.',
      rationale: 'Time-critical notification delivery latency causing operational delays.',
      daysAgo: 4,
      status: 'ACTIONED',
    },
    {
      channel: 'PLAY_STORE',
      rating: 2,
      name: 'Anand Kumar',
      email: 'anand.k@nexusventures.com',
      content: 'Battery drain is insane on version 2.4. Phone gets uncomfortably hot after 10 minutes of browsing items.',
      sentiment: 'NEGATIVE',
      score: -0.68,
      category: 'PERFORMANCE',
      urgency: 4,
      theme: 'Mobile App Stability',
      action: 'Profile background location polling and reduce render cycles.',
      rationale: 'Excessive CPU/battery usage flagged by multiple mobile users.',
      daysAgo: 3,
      status: 'NEW',
    },
    {
      channel: 'APP_STORE',
      rating: 4,
      name: 'Jessica Taylor',
      email: 'jtaylor@cloudpoint.com',
      content: 'Offline sync mode finally works properly! A few minor UI hiccups when reconnecting to Wi-Fi, but huge upgrade.',
      sentiment: 'POSITIVE',
      score: 0.72,
      category: 'UI_UX',
      urgency: 2,
      theme: 'Mobile App Stability',
      action: 'Smooth out the network reconnection sync banner animation.',
      rationale: 'Praise for offline persistence stability with minor visual polish requested.',
      daysAgo: 6,
      status: 'ACTIONED',
    },

    // Billing & Subscriptions
    {
      channel: 'SUPPORT_TICKET',
      rating: 1,
      name: 'Deepak Joshi',
      email: 'deepak@logistics360.com',
      content: 'We were double-charged for our annual enterprise subscription renewal. Raised ticket #9021 four days ago but zero response!',
      sentiment: 'NEGATIVE',
      score: -0.96,
      category: 'BILLING',
      urgency: 5,
      theme: 'Billing & Subscriptions',
      action: 'Immediately process duplicate charge refund and reach out to account lead.',
      rationale: 'Critical financial error and unfulfilled customer support SLA.',
      daysAgo: 2,
      status: 'NEW',
    },
    {
      channel: 'PORTAL',
      rating: 1,
      name: 'Emily Watson',
      email: 'ewatson@growthhub.io',
      content: 'Billing page keeps throwing a 500 error when I try to download our GST tax invoice for accounting audit.',
      sentiment: 'NEGATIVE',
      score: -0.85,
      category: 'BILLING',
      urgency: 4,
      theme: 'Billing & Subscriptions',
      action: 'Fix PDF generation template for tax invoices with special characters.',
      rationale: 'Compliance blocker: Customer cannot retrieve accounting invoices.',
      daysAgo: 3,
      status: 'REVIEWED',
    },
    {
      channel: 'SALES_CALL',
      rating: 2,
      name: 'Marcus Vance',
      email: 'mvance@acquireretail.com',
      content: 'Per-seat pricing scaling makes it cost-prohibitive for our 200 seasonal contractors who only log in once a month.',
      sentiment: 'NEGATIVE',
      score: -0.52,
      category: 'BILLING',
      urgency: 3,
      theme: 'Billing & Subscriptions',
      action: 'Propose flexible usage-tier or active-user pricing model to sales leadership.',
      rationale: 'Pricing packaging friction inhibiting large enterprise contract expansion.',
      daysAgo: 7,
      status: 'ACTIONED',
    },
    {
      channel: 'NPS_SURVEY',
      rating: 5,
      name: 'Harish Nair',
      email: 'hnair@solarsolutions.in',
      content: 'Honest, transparent pricing without hidden usage overage penalties. Love how easy it is to upgrade licenses.',
      sentiment: 'POSITIVE',
      score: 0.91,
      category: 'BILLING',
      urgency: 1,
      theme: 'Billing & Subscriptions',
      action: 'Feature quote in pricing page trust banner.',
      rationale: 'Positive appreciation of clear pricing structure.',
      daysAgo: 9,
      status: 'ACTIONED',
    },
    {
      channel: 'SUPPORT_TICKET',
      rating: 2,
      name: 'Linda Martinez',
      email: 'lmartinez@globalcorp.es',
      content: 'Our corporate AMEX card keeps getting declined by Stripe checkout even though international transactions are enabled.',
      sentiment: 'NEGATIVE',
      score: -0.71,
      category: 'BILLING',
      urgency: 4,
      theme: 'Billing & Subscriptions',
      action: 'Audit 3D Secure / Stripe webhook logs for international AMEX declines.',
      rationale: 'Payment processing gateway friction causing churn during renewal.',
      daysAgo: 5,
      status: 'REVIEWED',
    },

    // Performance & Latency
    {
      channel: 'SUPPORT_TICKET',
      rating: 1,
      name: 'Ananya Deshmukh',
      email: 'ananya@fintech.io',
      content: 'We keep getting a 504 Gateway Timeout whenever exporting customer CSV files with over 5,000 records. Blocking our month-end audit!',
      sentiment: 'NEGATIVE',
      score: -0.95,
      category: 'PERFORMANCE',
      urgency: 5,
      theme: 'Performance & Latency',
      action: 'Move CSV generation from sync HTTP route to background worker queue with presigned S3 download link.',
      rationale: 'High severity: Gateway timeout on large dataset export.',
      daysAgo: 2,
      status: 'NEW',
    },
    {
      channel: 'COMMUNITY',
      rating: 2,
      name: 'Rohan Gupta',
      email: 'rohan@ecomshop.com',
      content: 'Dashboard tables take 6-8 seconds to render when filtering by date range. Redis cache seems to be bypassed.',
      sentiment: 'NEGATIVE',
      score: -0.82,
      category: 'PERFORMANCE',
      urgency: 4,
      theme: 'Performance & Latency',
      action: 'Add composite database index on [tenantId, createdAt, status] and cache filter responses.',
      rationale: 'Sub-optimal query plan causing high latency on filtered inbox queries.',
      daysAgo: 4,
      status: 'REVIEWED',
    },
    {
      channel: 'NPS_SURVEY',
      rating: 5,
      name: 'Karthik Rao',
      email: 'karthik@techcorp.in',
      content: 'The new analytics dashboard is blazing fast and super clean. Instant search query execution makes triaging a joy!',
      sentiment: 'POSITIVE',
      score: 0.96,
      category: 'PERFORMANCE',
      urgency: 1,
      theme: 'Performance & Latency',
      action: 'Highlight speed benchmarks in customer-facing case study.',
      rationale: 'Strong customer satisfaction with new client-side indexing and instant charts.',
      daysAgo: 5,
      status: 'ACTIONED',
    },
    {
      channel: 'SUPPORT_TICKET',
      rating: 2,
      name: 'Elena Rostova',
      email: 'elena@novasoft.de',
      content: 'Webhook payloads are arriving out of sequence with 30-second delays during peak US business hours.',
      sentiment: 'NEGATIVE',
      score: -0.69,
      category: 'PERFORMANCE',
      urgency: 3,
      theme: 'Performance & Latency',
      action: 'Implement FIFO queue semantics and partition event dispatcher workers.',
      rationale: 'Concurrency bottleneck during peak server load causing webhook delivery jitter.',
      daysAgo: 8,
      status: 'ACTIONED',
    },

    // Enterprise SSO & Security
    {
      channel: 'SALES_CALL',
      rating: 3,
      name: 'Vikram Sethi',
      email: 'vsethi@globalventures.com',
      content: 'Can you please add support for Google & Okta Single Sign-On (SSO)? Our enterprise security policies mandate SAML/SSO for all SaaS vendors.',
      sentiment: 'NEUTRAL',
      score: 0.15,
      category: 'FEATURE_REQUEST',
      urgency: 3,
      theme: 'Enterprise SSO & Security',
      action: 'Prioritize SAML 2.0 / Okta integration in enterprise roadmap.',
      rationale: 'Key enterprise deal-closer requested by multiple prospects.',
      daysAgo: 3,
      status: 'NEW',
    },
    {
      channel: 'SUPPORT_TICKET',
      rating: 4,
      name: 'Rachel Adams',
      email: 'radams@aerofinance.com',
      content: 'Role-Based Access Control works great for Analysts vs Viewers, but we need custom permissions so Viewers cannot see customer PII.',
      sentiment: 'POSITIVE',
      score: 0.61,
      category: 'FEATURE_REQUEST',
      urgency: 2,
      theme: 'Enterprise SSO & Security',
      action: 'Design granular column-level PII masking for restricted roles.',
      rationale: 'Compliance enhancement request for role-based privacy masking.',
      daysAgo: 10,
      status: 'REVIEWED',
    },
    {
      channel: 'COMMUNITY',
      rating: 3,
      name: 'Tomer Levin',
      email: 'tomer@cyberguard.il',
      content: 'Please enforce two-factor authentication (2FA) for all users with the Admin role across the organization.',
      sentiment: 'NEUTRAL',
      score: 0.05,
      category: 'FEATURE_REQUEST',
      urgency: 3,
      theme: 'Enterprise SSO & Security',
      action: 'Implement mandatory TOTP 2FA toggle in organization security settings.',
      rationale: 'Standard security hygiene requirement from cybersecurity teams.',
      daysAgo: 12,
      status: 'ACTIONED',
    },

    // UI/UX & Dark Mode
    {
      channel: 'PORTAL',
      rating: 5,
      name: 'Aisha Al-Mansoor',
      email: 'aisha@zenithmedia.ae',
      content: 'The dark mode aesthetic is absolute perfection! The purple and slate tones look like a top-tier Linear or Vercel product.',
      sentiment: 'POSITIVE',
      score: 0.98,
      category: 'UI_UX',
      urgency: 1,
      theme: 'UI/UX & Dark Mode',
      action: 'Share praise with design team; prepare dark-mode marketing screenshots.',
      rationale: 'High praise for dark mode color palette, contrast, and visual finish.',
      daysAgo: 3,
      status: 'ACTIONED',
    },
    {
      channel: 'NPS_SURVEY',
      rating: 2,
      name: 'Kavita Chawla',
      email: 'kavita@educloud.net',
      content: 'The font size on reports is too tiny on standard 13-inch laptop screens, causing eye strain. Please give an option to scale UI text.',
      sentiment: 'NEGATIVE',
      score: -0.64,
      category: 'UI_UX',
      urgency: 2,
      theme: 'UI/UX & Dark Mode',
      action: 'Adjust base typography rem sizing and test WCAG 2.1 AA readability.',
      rationale: 'Accessibility feedback regarding text sizing on compact laptops.',
      daysAgo: 6,
      status: 'REVIEWED',
    },
    {
      channel: 'PORTAL',
      rating: 5,
      name: 'Devin Brooks',
      email: 'dbrooks@modernstack.io',
      content: 'Keyboard shortcuts for triaging feedback (J/K navigation and 1-3 for status) save me over an hour every morning. Genius UX!',
      sentiment: 'POSITIVE',
      score: 0.94,
      category: 'UI_UX',
      urgency: 1,
      theme: 'UI/UX & Dark Mode',
      action: 'Add keyboard shortcut hint tooltip in navigation bar.',
      rationale: 'Productivity acceleration praised by power users.',
      daysAgo: 8,
      status: 'ACTIONED',
    },
    {
      channel: 'TWITTER',
      rating: 3,
      name: 'Tanya Sen',
      email: 'tanya@designstudio.io',
      content: 'Filters on the feedback table reset automatically whenever page refreshes. Annoying when doing bulk analysis across multiple tabs.',
      sentiment: 'NEGATIVE',
      score: -0.55,
      category: 'UI_UX',
      urgency: 2,
      theme: 'UI/UX & Dark Mode',
      action: 'Sync active filter state with URL query parameters for persistent bookmarking.',
      rationale: 'UX friction: Inability to persist filter state on page reload.',
      daysAgo: 1,
      status: 'NEW',
    },

    // CSV & API Integrations
    {
      channel: 'COMMUNITY',
      rating: 4,
      name: 'Arjun Reddy',
      email: 'arjun@startuphub.co',
      content: 'CSV bulk importer parsed 4,000 feedback records in under 3 seconds without a single malformed row error. Impressive parser!',
      sentiment: 'POSITIVE',
      score: 0.89,
      category: 'FEATURE_REQUEST',
      urgency: 1,
      theme: 'CSV & API Integrations',
      action: 'Document CSV import benchmarks in user guide.',
      rationale: 'Customer validates high reliability of CSV bulk ingestion pipeline.',
      daysAgo: 5,
      status: 'ACTIONED',
    },
    {
      channel: 'SUPPORT_TICKET',
      rating: 3,
      name: 'Simon Fischer',
      email: 'sfischer@autoview.de',
      content: 'Does the REST API support batch ingestion via POST /api/feedback/batch? Uploading one item at a time is slow for our ETL script.',
      sentiment: 'NEUTRAL',
      score: 0.12,
      category: 'FEATURE_REQUEST',
      urgency: 2,
      theme: 'CSV & API Integrations',
      action: 'Provide public SDK example for batch ingestion endpoint.',
      rationale: 'Developer ergonomics request for bulk API ingestion endpoint.',
      daysAgo: 7,
      status: 'REVIEWED',
    },
    {
      channel: 'PORTAL',
      rating: 5,
      name: 'Meera Nambiar',
      email: 'meera@healthtrack.org',
      content: 'The API documentation with live cURL examples made webhook integration effortless for our engineering team. Done in 15 mins!',
      sentiment: 'POSITIVE',
      score: 0.95,
      category: 'FEATURE_REQUEST',
      urgency: 1,
      theme: 'CSV & API Integrations',
      action: 'Highlight developer documentation in sales collateral.',
      rationale: 'Praise for developer documentation and rapid integration onboarding.',
      daysAgo: 11,
      status: 'ACTIONED',
    },

    // Customer Support Quality
    {
      channel: 'PORTAL',
      rating: 5,
      name: 'Sneha Kulkarni',
      email: 'sneha@retailplus.in',
      content: 'Support engineer guided our developers to configure custom webhook events within 10 minutes. World-class technical assistance!',
      sentiment: 'POSITIVE',
      score: 0.97,
      category: 'OTHER',
      urgency: 1,
      theme: 'Customer Support Quality',
      action: 'Share commendation with support team in all-hands meeting.',
      rationale: 'Exceptional support engineer competence and fast problem resolution.',
      daysAgo: 4,
      status: 'ACTIONED',
    },
    {
      channel: 'NPS_SURVEY',
      rating: 2,
      name: 'Patrick O\'Connor',
      email: 'poconnor@celticlogistics.ie',
      content: 'Chatbot keeps looping repetitive troubleshooting steps instead of transferring to a live agent when an issue is urgent.',
      sentiment: 'NEGATIVE',
      score: -0.73,
      category: 'OTHER',
      urgency: 3,
      theme: 'Customer Support Quality',
      action: 'Add instant "Talk to human agent" fallback trigger in support bot.',
      rationale: 'Customer frustration with rigid automated chatbot loop.',
      daysAgo: 6,
      status: 'REVIEWED',
    },
    {
      channel: 'PORTAL',
      rating: 5,
      name: 'Amara Okafor',
      email: 'amara@finwest.ng',
      content: 'Whenever we open a ticket, support responds within 15 minutes with actual technical answers, not generic canned scripts. Refreshing!',
      sentiment: 'POSITIVE',
      score: 0.92,
      category: 'OTHER',
      urgency: 1,
      theme: 'Customer Support Quality',
      action: 'Maintain strict SLA benchmarks for high-tier accounts.',
      rationale: 'High appraisal for rapid first response and knowledgeable personnel.',
      daysAgo: 9,
      status: 'ACTIONED',
    },
  ];

  // We expand this core list systematically into 130 items by generating realistic permutations across the 7 themes
  const additionalTemplates = [
    {
      theme: 'Mobile App Stability',
      category: 'BUG',
      samples: [
        { text: 'Android app crashes on logout when biometrics are enabled.', sentiment: 'NEGATIVE', score: -0.84, rating: 1, urgency: 4, channel: 'PLAY_STORE' },
        { text: 'App is running smoothly on iPad mini, nice tablet layout!', sentiment: 'POSITIVE', score: 0.81, rating: 5, urgency: 1, channel: 'APP_STORE' },
        { text: 'Camera capture resolution defaults to 720p on Samsung Galaxy S23.', sentiment: 'NEUTRAL', score: -0.1, rating: 3, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'FaceID login fails silently without an error prompt on iOS 17.5.', sentiment: 'NEGATIVE', score: -0.79, rating: 2, urgency: 4, channel: 'APP_STORE' },
        { text: 'Latest update fixed the background sync battery drain. Much better now.', sentiment: 'POSITIVE', score: 0.88, rating: 5, urgency: 1, channel: 'PLAY_STORE' },
        { text: 'Screen rotation causes form input fields to wipe out entirely.', sentiment: 'NEGATIVE', score: -0.86, rating: 1, urgency: 5, channel: 'COMMUNITY' },
        { text: 'Bluetooth barcode scanner disconnects after 5 minutes of inactivity.', sentiment: 'NEGATIVE', score: -0.62, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'Smooth 60fps animations on iPhone 15 Pro. Feels very responsive.', sentiment: 'POSITIVE', score: 0.93, rating: 5, urgency: 1, channel: 'APP_STORE' },
        { text: 'App needs an offline queue for submitting feedback when underground.', sentiment: 'NEUTRAL', score: 0.1, rating: 3, urgency: 2, channel: 'PLAY_STORE' },
        { text: 'Push notifications badge count is stuck at 99+ even after clearing inbox.', sentiment: 'NEGATIVE', score: -0.58, rating: 2, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'Landscape mode on Android tablet overlaps sidebar with chat window.', sentiment: 'NEGATIVE', score: -0.71, rating: 2, urgency: 3, channel: 'PLAY_STORE' },
        { text: 'Quick action haptic feedback feels very native and polished on iOS.', sentiment: 'POSITIVE', score: 0.86, rating: 5, urgency: 1, channel: 'APP_STORE' },
        { text: 'Widget on home screen does not refresh data until app is opened.', sentiment: 'NEUTRAL', score: -0.15, rating: 3, urgency: 2, channel: 'PLAY_STORE' },
        { text: 'Sound effects on completion are too loud and cannot be muted in settings.', sentiment: 'NEGATIVE', score: -0.45, rating: 3, urgency: 2, channel: 'COMMUNITY' },
        { text: 'App launch speed improved noticeably after the last CDN update.', sentiment: 'POSITIVE', score: 0.89, rating: 5, urgency: 1, channel: 'PLAY_STORE' },
      ],
    },
    {
      theme: 'Billing & Subscriptions',
      category: 'BILLING',
      samples: [
        { text: 'Need the ability to split invoice across two department credit cards.', sentiment: 'NEUTRAL', score: 0.05, rating: 3, urgency: 2, channel: 'SALES_CALL' },
        { text: 'Refund for canceled seat was credited to our bank account within 24 hours. Great service!', sentiment: 'POSITIVE', score: 0.94, rating: 5, urgency: 1, channel: 'SUPPORT_TICKET' },
        { text: 'Invoice email is sent to user instead of our AP finance billing address.', sentiment: 'NEGATIVE', score: -0.66, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'Annual prepayment discount of 20% was clearly applied. No complaints.', sentiment: 'POSITIVE', score: 0.85, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Payment gateway rejected European VAT ID without clear validation message.', sentiment: 'NEGATIVE', score: -0.77, rating: 2, urgency: 4, channel: 'PORTAL' },
        { text: 'Please add automated purchase order (PO) generation on checkout.', sentiment: 'NEUTRAL', score: 0.15, rating: 4, urgency: 2, channel: 'SALES_CALL' },
        { text: 'Overcharged by $45 on pro-rated billing change. Support resolved in 10 mins.', sentiment: 'POSITIVE', score: 0.62, rating: 4, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'Credit card update modal freezes when submitting new expiration date.', sentiment: 'NEGATIVE', score: -0.83, rating: 1, urgency: 5, channel: 'PORTAL' },
        { text: 'Receipts show price in USD but our bank statement shows AUD conversion fee.', sentiment: 'NEUTRAL', score: -0.2, rating: 3, urgency: 2, channel: 'EMAIL' },
        { text: 'Subscription management portal is intuitive and self-service. Saved us phone calls.', sentiment: 'POSITIVE', score: 0.89, rating: 5, urgency: 1, channel: 'NPS_SURVEY' },
        { text: 'Need automated tax exemption certificates upload for non-profit accounts.', sentiment: 'NEUTRAL', score: 0.1, rating: 4, urgency: 2, channel: 'SALES_CALL' },
        { text: 'Currency conversion rates updated in real-time without hidden markup.', sentiment: 'POSITIVE', score: 0.91, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Auto-renewal warning email was sent only 2 hours before charging card.', sentiment: 'NEGATIVE', score: -0.69, rating: 2, urgency: 3, channel: 'EMAIL' },
        { text: 'Billing history PDF includes all line items and tax breakdown cleanly.', sentiment: 'POSITIVE', score: 0.87, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Failed payment retry policy gave us 7 grace days to update card. Appreciated!', sentiment: 'POSITIVE', score: 0.92, rating: 5, urgency: 1, channel: 'SUPPORT_TICKET' },
      ],
    },
    {
      theme: 'Performance & Latency',
      category: 'PERFORMANCE',
      samples: [
        { text: 'Elasticsearch query latency jumped from 20ms to 450ms this morning.', sentiment: 'NEGATIVE', score: -0.76, rating: 2, urgency: 4, channel: 'SUPPORT_TICKET' },
        { text: 'Page transition speeds are snappy across all dashboard sections.', sentiment: 'POSITIVE', score: 0.92, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Real-time charts load instantly even with 100,000 raw events selected.', sentiment: 'POSITIVE', score: 0.95, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Exporting 10k rows takes over 40 seconds; please stream the download.', sentiment: 'NEGATIVE', score: -0.72, rating: 2, urgency: 3, channel: 'PORTAL' },
        { text: 'Image thumbnails load with visible stuttering on 3G network.', sentiment: 'NEGATIVE', score: -0.54, rating: 3, urgency: 2, channel: 'PORTAL' },
        { text: 'Search bar autocomplete responds within 50ms. Very impressive backend!', sentiment: 'POSITIVE', score: 0.91, rating: 5, urgency: 1, channel: 'NPS_SURVEY' },
        { text: 'Periodic 502 bad gateway spikes observed during database backup window.', sentiment: 'NEGATIVE', score: -0.88, rating: 1, urgency: 5, channel: 'SUPPORT_TICKET' },
        { text: 'Initial JS bundle size is lightweight, first contentful paint under 0.8s.', sentiment: 'POSITIVE', score: 0.87, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Sorting by column header triggers full page re-fetch instead of local sort.', sentiment: 'NEUTRAL', score: -0.25, rating: 3, urgency: 2, channel: 'PORTAL' },
        { text: 'Memory consumption in Chrome tab climbed past 600MB after 2 hours.', sentiment: 'NEGATIVE', score: -0.71, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'CDN edge caching in Mumbai delivers sub-100ms response times consistently.', sentiment: 'POSITIVE', score: 0.94, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Filter dropdown experiences 300ms input lag when selecting multi-choice tags.', sentiment: 'NEGATIVE', score: -0.49, rating: 3, urgency: 2, channel: 'PORTAL' },
        { text: 'Websocket connection reconnects seamlessly upon waking laptop from sleep.', sentiment: 'POSITIVE', score: 0.88, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Database query timeout on report generation when selecting All Time range.', sentiment: 'NEGATIVE', score: -0.82, rating: 2, urgency: 4, channel: 'SUPPORT_TICKET' },
        { text: 'Asset caching headers are properly set, repeat visits load in milliseconds.', sentiment: 'POSITIVE', score: 0.93, rating: 5, urgency: 1, channel: 'COMMUNITY' },
      ],
    },
    {
      theme: 'Enterprise SSO & Security',
      category: 'FEATURE_REQUEST',
      samples: [
        { text: 'SAML 2.0 integration with Microsoft Entra ID (Azure AD) is required by our CISO.', sentiment: 'NEUTRAL', score: 0.1, rating: 3, urgency: 4, channel: 'SALES_CALL' },
        { text: 'Role permissions are cleanly scoped, our auditor approved tenant isolation.', sentiment: 'POSITIVE', score: 0.89, rating: 5, urgency: 1, channel: 'SUPPORT_TICKET' },
        { text: 'Session timeout of 15 minutes is too aggressive for data analysis workflows.', sentiment: 'NEGATIVE', score: -0.45, rating: 3, urgency: 2, channel: 'PORTAL' },
        { text: 'Audit log exports should include IP address and user agent for SOC2 compliance.', sentiment: 'NEUTRAL', score: 0.0, rating: 3, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'SCIM user provisioning would automate deactivating departed employees.', sentiment: 'NEUTRAL', score: 0.2, rating: 4, urgency: 3, channel: 'SALES_CALL' },
        { text: 'Role switching between Admin and Analyst works smoothly without re-login.', sentiment: 'POSITIVE', score: 0.86, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Security headers (CSP, HSTS) scored A+ on Qualys SSL Labs audit.', sentiment: 'POSITIVE', score: 0.97, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Password reset link expired before the user received the email.', sentiment: 'NEGATIVE', score: -0.63, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'Would love hardware security key (YubiKey) WebAuthn support for login.', sentiment: 'NEUTRAL', score: 0.25, rating: 4, urgency: 2, channel: 'PORTAL' },
        { text: 'Restricted viewer role prevents accidental data modifications effectively.', sentiment: 'POSITIVE', score: 0.84, rating: 5, urgency: 1, channel: 'NPS_SURVEY' },
        { text: 'API key secret token can be rolled with zero-downtime grace period. Superb!', sentiment: 'POSITIVE', score: 0.92, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Please add IP whitelisting for corporate VPN subnet ranges.', sentiment: 'NEUTRAL', score: 0.1, rating: 4, urgency: 3, channel: 'SALES_CALL' },
        { text: 'Need custom session timeout duration configuration in tenant security tab.', sentiment: 'NEUTRAL', score: 0.05, rating: 3, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'End-to-end TLS 1.3 encryption and automated certificate rotation verified.', sentiment: 'POSITIVE', score: 0.95, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Missing webhook signature verification documentation in security whitepaper.', sentiment: 'NEGATIVE', score: -0.41, rating: 3, urgency: 2, channel: 'COMMUNITY' },
      ],
    },
    {
      theme: 'UI/UX & Dark Mode',
      category: 'UI_UX',
      samples: [
        { text: 'The card contrast in dark mode makes data scanning effortless on OLED monitors.', sentiment: 'POSITIVE', score: 0.93, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Dropdown menus close prematurely when mouse hovers over child options.', sentiment: 'NEGATIVE', score: -0.6, rating: 2, urgency: 2, channel: 'PORTAL' },
        { text: 'Clean typography and spacing; reminds me of Apple and Stripe interfaces.', sentiment: 'POSITIVE', score: 0.96, rating: 5, urgency: 1, channel: 'NPS_SURVEY' },
        { text: 'Date picker component is confusing when selecting cross-month ranges.', sentiment: 'NEGATIVE', score: -0.52, rating: 3, urgency: 2, channel: 'PORTAL' },
        { text: 'Color-coded sentiment pills (emerald, amber, rose) provide instant clarity.', sentiment: 'POSITIVE', score: 0.9, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Need a toggle to switch between compact and comfortable table row padding.', sentiment: 'NEUTRAL', score: 0.1, rating: 4, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Modal popups do not close when pressing the Escape key.', sentiment: 'NEGATIVE', score: -0.58, rating: 2, urgency: 2, channel: 'PORTAL' },
        { text: 'Breadcrumb navigation is helpful when drilling deep into filtered views.', sentiment: 'POSITIVE', score: 0.82, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Toast notifications disappear too quickly (after 2 seconds) to read error details.', sentiment: 'NEGATIVE', score: -0.48, rating: 3, urgency: 2, channel: 'PORTAL' },
        { text: 'Empty state illustrations and guided tooltips helped our interns onboard fast.', sentiment: 'POSITIVE', score: 0.92, rating: 5, urgency: 1, channel: 'NPS_SURVEY' },
        { text: 'Light mode has too much glare on high-brightness monitors. Defaulting to dark is great.', sentiment: 'POSITIVE', score: 0.88, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Table horizontal scrollbar disappears on macOS when trackpad scrolling.', sentiment: 'NEGATIVE', score: -0.51, rating: 3, urgency: 2, channel: 'PORTAL' },
      ],
    },
    {
      theme: 'CSV & API Integrations',
      category: 'FEATURE_REQUEST',
      samples: [
        { text: 'API rate limits of 1,000 requests/min are generous for our ingestion sync.', sentiment: 'POSITIVE', score: 0.88, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'CSV import fails without descriptive error if column header has leading space.', sentiment: 'NEGATIVE', score: -0.67, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'Zapier integration would allow non-technical teams to sync Google Forms feedback.', sentiment: 'NEUTRAL', score: 0.2, rating: 4, urgency: 2, channel: 'SALES_CALL' },
        { text: 'JSON payload validation via Zod catches schema mismatches immediately.', sentiment: 'POSITIVE', score: 0.94, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Webhook retry mechanism with exponential backoff saved us during downtime.', sentiment: 'POSITIVE', score: 0.91, rating: 5, urgency: 1, channel: 'SUPPORT_TICKET' },
        { text: 'Please support TSV and Excel (.xlsx) file uploads alongside standard CSV.', sentiment: 'NEUTRAL', score: 0.15, rating: 4, urgency: 2, channel: 'PORTAL' },
        { text: 'Exported CSV file lacks UTF-8 BOM, causing accented characters to garble in Excel.', sentiment: 'NEGATIVE', score: -0.74, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
        { text: 'The cURL examples in API documentation worked on the first try.', sentiment: 'POSITIVE', score: 0.95, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Can we get an official Python client library on PyPI for automated scripts?', sentiment: 'NEUTRAL', score: 0.3, rating: 4, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Bulk delete endpoint requires 100 individual calls instead of batch array.', sentiment: 'NEGATIVE', score: -0.59, rating: 3, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'Sample postman collection helped us verify API endpoints in 5 minutes.', sentiment: 'POSITIVE', score: 0.94, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'GraphQL API would reduce round-trips for our mobile app dashboard.', sentiment: 'NEUTRAL', score: 0.1, rating: 4, urgency: 2, channel: 'PORTAL' },
      ],
    },
    {
      theme: 'Customer Support Quality',
      category: 'OTHER',
      samples: [
        { text: 'Agent Priya resolved our DNS domain verification issue in under 8 minutes!', sentiment: 'POSITIVE', score: 0.98, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Automated email notification had broken hyperlink to support portal.', sentiment: 'NEGATIVE', score: -0.5, rating: 2, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'Knowledge base search is thorough and includes code snippets for common issues.', sentiment: 'POSITIVE', score: 0.9, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Support hours are limited to PST business hours; we need 24/7 coverage in Asia.', sentiment: 'NEGATIVE', score: -0.65, rating: 2, urgency: 3, channel: 'SALES_CALL' },
        { text: 'Live chat widget loads smoothly and does not lag the host website.', sentiment: 'POSITIVE', score: 0.85, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Received three duplicate survey emails after closing one simple ticket.', sentiment: 'NEGATIVE', score: -0.57, rating: 2, urgency: 2, channel: 'EMAIL' },
        { text: 'Quarterly business review with our account manager was insightful and proactive.', sentiment: 'POSITIVE', score: 0.93, rating: 5, urgency: 1, channel: 'SALES_CALL' },
        { text: 'Video tutorials in the academy section made training 15 analysts simple.', sentiment: 'POSITIVE', score: 0.89, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Ticket status did not change to Pending Customer after agent responded.', sentiment: 'NEGATIVE', score: -0.42, rating: 3, urgency: 2, channel: 'SUPPORT_TICKET' },
        { text: 'Customer success engineer built a custom reporting dashboard for our execs. Above and beyond!', sentiment: 'POSITIVE', score: 0.99, rating: 5, urgency: 1, channel: 'COMMUNITY' },
        { text: 'Status page alerts are sent within 60 seconds of any third party degradation.', sentiment: 'POSITIVE', score: 0.93, rating: 5, urgency: 1, channel: 'PORTAL' },
        { text: 'Documentation lacks clear instructions for rotating expired SSL certificates.', sentiment: 'NEGATIVE', score: -0.62, rating: 2, urgency: 3, channel: 'SUPPORT_TICKET' },
      ],
    },
  ];

  const firstNames = ['Aravind', 'Maya', 'Nathan', 'Chloe', 'Zubair', 'Fatima', 'Liam', 'Sophia', 'Kenji', 'Hassan', 'Olga', 'Mateo', 'Hannah', 'Sanjay', 'Beatriz'];
  const companies = ['techcorp.com', 'acmeflow.io', 'hypercloud.dev', 'retailpulse.co', 'scaleventures.org', 'nexussystems.net'];

  const allFeedbacksToInsert = [...rawFeedbackPool];

  // Add additional generated feedback items to exceed 125 total
  let counter = 0;
  for (const group of additionalTemplates) {
    for (const item of group.samples) {
      counter++;
      const fn = firstNames[counter % firstNames.length];
      const comp = companies[counter % companies.length];
      const days = (counter % 28) + 1;
      const statuses = ['NEW', 'REVIEWED', 'ACTIONED'];
      const status = statuses[counter % statuses.length];

      allFeedbacksToInsert.push({
        channel: item.channel,
        rating: item.rating,
        name: `${fn} User`,
        email: `${fn.toLowerCase()}@${comp}`,
        content: item.text,
        sentiment: item.sentiment,
        score: item.score,
        category: group.category,
        urgency: item.urgency,
        theme: group.theme,
        action: `Review ${group.theme.toLowerCase()} feedback and coordinate team response.`,
        rationale: `Customer noted aspects regarding ${group.theme.toLowerCase()} with ${item.sentiment.toLowerCase()} indicator.`,
        daysAgo: days,
        status,
      });
    }
  }

  // Insert all feedbacks with theme relations
  console.log(`Inserting ${allFeedbacksToInsert.length} feedback items into database...`);

  let count = 0;
  for (const fb of allFeedbacksToInsert) {
    count++;
    const createdFeedback = await prisma.feedback.create({
      data: {
        tenantId: tenant.id,
        customerName: fb.name,
        customerEmail: fb.email,
        channel: fb.channel,
        rating: fb.rating,
        content: fb.content,
        status: fb.status,
        isAnalyzed: true,
        sentiment: fb.sentiment,
        sentimentScore: fb.score,
        sentimentRationale: fb.rationale,
        category: fb.category,
        urgencyScore: fb.urgency,
        actionSuggestion: fb.action,
        createdAt: new Date(now - fb.daysAgo * dayMs),
      },
    });

    const themeId = themeMap[fb.theme];
    if (themeId) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: createdFeedback.id,
          themeId: themeId,
          confidence: Math.abs(fb.score) > 0.5 ? 0.95 : 0.82,
        },
      });
    }
  }

  console.log(`Successfully seeded ${count} feedback records with theme relationships!`);

  // 6. Pre-generate an Executive VoC Report
  const total = allFeedbacksToInsert.length;
  const positiveCount = allFeedbacksToInsert.filter(f => f.sentiment === 'POSITIVE').length;
  const negativeCount = allFeedbacksToInsert.filter(f => f.sentiment === 'NEGATIVE').length;
  const neutralCount = allFeedbacksToInsert.filter(f => f.sentiment === 'NEUTRAL').length;
  const netScore = Math.round(((positiveCount - negativeCount) / total) * 100);

  await prisma.vocReport.create({
    data: {
      tenantId: tenant.id,
      title: 'Executive Voice-of-Customer Intelligence Brief (Q3 2026)',
      timeRange: 'Last 30 Days',
      totalFeedbacks: total,
      positiveCount,
      negativeCount,
      neutralCount,
      netSentimentScore: netScore,
      topThemes: JSON.stringify([
        'UI/UX & Dark Mode Satisfaction (Highest Positive)',
        'Mobile App Stability on Android 14 (Critical Blocker)',
        'Performance & CSV Export Latency (High Churn Risk)',
        'Enterprise SSO / SAML Requests (Top Sales Blocker)',
        'Customer Support & Documentation (Key Differentiator)'
      ]),
      keyStrengths: JSON.stringify([
        'Dark mode and UI ergonomics received 95%+ positive rating across community channels and power users.',
        'Customer support technical response times (under 15 mins) frequently cited as best-in-class.',
        'CSV bulk importer speed and developer API documentation facilitate rapid enterprise onboarding.'
      ]),
      criticalIssues: JSON.stringify([
        'Fatal crash on Android 14 launch affecting app v2.4.1 (Urgency: Critical, 5/5).',
        '504 Gateway Timeout during CSV export when datasets exceed 5,000 records.',
        'Enterprise sales opportunities blocked pending SAML 2.0 / Okta SSO integration.'
      ]),
      executiveSummary: `During the last 30 days, Project LOOP analyzed ${total} multi-channel customer interactions. Overall customer sentiment reflects strong Net Sentiment (+${netScore}) driven by UI ergonomics, responsive customer support, and fast developer APIs. However, severe technical friction points in mobile stability (Android 14 startup crash) and large CSV export timeouts pose immediate churn risks for mid-market and enterprise cohorts.`,
      actionPlan: `1. Engineering Hotfix: Release mobile v2.4.2 patch immediately addressing Android 14 splash screen crash.\n2. Infrastructure Scalability: Transition CSV generation from sync HTTP endpoints to background asynchronous worker queue.\n3. Product Roadmap: Fast-track SAML 2.0 / Okta SSO to unblock pending enterprise sales pipeline.\n4. Finance & Billing: Implement 24-hour SLA alert for billing dispute tickets to prevent escalation.`,
      createdBy: 'Rahul Sharma (Admin) via AI Engine',
    },
  });

  console.log('Pre-generated Executive Voice-of-Customer report seeded.');
  console.log('--- SEED COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
