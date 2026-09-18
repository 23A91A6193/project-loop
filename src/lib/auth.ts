import { cookies } from 'next/headers';
import prisma from './prisma';
import { NextResponse } from 'next/server';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export const COOKIE_NAME = 'loop_auth_session';

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    // If no cookie, return default admin for seamless initial exploration if needed,
    // or null if strict
    const defaultUser = await prisma.user.findFirst({
      where: { email: 'admin@acme.com' },
      include: { tenant: true },
    });

    if (defaultUser) {
      return {
        userId: defaultUser.id,
        email: defaultUser.email,
        name: defaultUser.name,
        role: defaultUser.role as any,
        tenantId: defaultUser.tenantId,
        tenantName: defaultUser.tenant.name,
        tenantSlug: defaultUser.tenant.slug,
      };
    }
    return null;
  }

  try {
    const raw = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const data = JSON.parse(raw);

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { tenant: true },
    });

    if (!user) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
    };
  } catch {
    return null;
  }
}

export function createSessionCookieString(payload: { userId: string }): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function requireAuth(allowedRoles?: Array<'ADMIN' | 'ANALYST' | 'VIEWER'>): Promise<{ session: AuthSession | null; errorResponse: NextResponse | null }> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 }),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: `Forbidden: Action requires ${allowedRoles.join(' or ')} privileges. Your role: ${session.role}` },
        { status: 403 }
      ),
    };
  }

  return { session, errorResponse: null };
}
