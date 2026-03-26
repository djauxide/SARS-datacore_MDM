import { NextResponse } from 'next/server'
import { runDiscovery } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function POST() {
  await runDiscovery()
  return NextResponse.json({ ok: true })
}
