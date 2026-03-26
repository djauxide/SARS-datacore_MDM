import type { NextRequest } from 'next/server'
import type { SessionRecord, UserRecord } from './types'

const cookieName = 'nexus-session'

export function encodeSession(user: UserRecord): string {
  const payload: SessionRecord = {
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    siteId: user.siteId,
  }

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeSession(value?: string | null): SessionRecord | null {
  if (!value) return null

  try {
    const raw = Buffer.from(value, 'base64url').toString('utf8')
    return JSON.parse(raw) as SessionRecord
  } catch {
    return null
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return decodeSession(request.cookies.get(cookieName)?.value)
}

export function getSessionCookieName() {
  return cookieName
}
