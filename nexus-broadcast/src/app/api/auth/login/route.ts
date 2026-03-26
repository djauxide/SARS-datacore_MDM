import { NextRequest, NextResponse } from 'next/server'
import { encodeSession, getSessionCookieName } from '@/lib/auth'
import { getUsers } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { userId?: number }
  const user = getUsers().find((candidate) => candidate.id === body.userId)

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  const response = NextResponse.json({
    session: {
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      siteId: user.siteId,
    },
  })

  response.cookies.set(getSessionCookieName(), encodeSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
