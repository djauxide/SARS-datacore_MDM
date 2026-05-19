import { NextRequest, NextResponse } from 'next/server'
import { evaluatePolicy } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { domain?: string; action?: string; role?: string; classification?: string }
  return NextResponse.json({ policy: evaluatePolicy(body) })
}

