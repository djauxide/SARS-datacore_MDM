import { NextResponse } from 'next/server'
import { getSarsMdmSnapshot } from '@/lib/sars-datacore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getSarsMdmSnapshot())
}

