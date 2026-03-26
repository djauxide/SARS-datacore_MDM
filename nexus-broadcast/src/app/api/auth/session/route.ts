import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, encodeSession, getSessionCookieName } from '@/lib/auth'
import { getUsers } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const existing = decodeSession(request.cookies.get(getSessionCookieName())?.value)
  if (existing) {
    return NextResponse.json({ session: existing })
  }

  const defaultUser = getUsers()[0]
  const session = {
    name: defaultUser.name,
    email: defaultUser.email,
    role: defaultUser.role,
    tenantId: defaultUser.tenantId,
    siteId: defaultUser.siteId,
  }
  const response = NextResponse.json({ session })
  response.cookies.set(getSessionCookieName(), encodeSession(defaultUser), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  return response
}
