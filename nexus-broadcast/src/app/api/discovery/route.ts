import { NextResponse } from 'next/server'
import { runDiscovery } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function POST() {
  runDiscovery()
  return NextResponse.json({ ok: true })
}
