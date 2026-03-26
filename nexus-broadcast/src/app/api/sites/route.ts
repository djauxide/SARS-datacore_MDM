import { NextResponse } from 'next/server'
import { getPlatformSnapshot } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = getPlatformSnapshot()
  return NextResponse.json({ sites: snapshot.sites, tenants: snapshot.tenants })
}
