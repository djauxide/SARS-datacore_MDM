import { NextRequest, NextResponse } from 'next/server'
import {
  advanceOnboarding,
  fireScteMarker,
  getManagementState,
  launchCtvChannel,
  onboardCustomer,
  setMiddlewareStatus,
  startAdCampaign,
} from '@/lib/nexus-db'
import type { MiddlewareAppRecord } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getManagementState())
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as
    | { action: 'onboard-customer'; name: string; brand: string; region: string; contactEmail: string; tier?: 'Launch' | 'Growth' | 'Enterprise' }
    | { action: 'set-middleware-status'; appId: number; status: MiddlewareAppRecord['status'] }
    | { action: 'advance-onboarding'; customerId: number }
    | { action: 'launch-channel'; channelId: number }
    | { action: 'fire-scte-marker'; markerId: number }
    | { action: 'start-campaign'; campaignId: number }

  if (body.action === 'onboard-customer') {
    if (!body.name || !body.brand || !body.region || !body.contactEmail) {
      return NextResponse.json({ error: 'Customer name, brand, region, and contact email are required.' }, { status: 400 })
    }
    return NextResponse.json({ customer: await onboardCustomer(body) })
  }

  if (body.action === 'set-middleware-status') {
    return NextResponse.json({ app: await setMiddlewareStatus(body.appId, body.status) })
  }

  if (body.action === 'advance-onboarding') {
    return NextResponse.json({ customer: await advanceOnboarding(body.customerId) })
  }

  if (body.action === 'launch-channel') {
    return NextResponse.json({ channel: await launchCtvChannel(body.channelId) })
  }

  if (body.action === 'fire-scte-marker') {
    return NextResponse.json({ marker: await fireScteMarker(body.markerId) })
  }

  if (body.action === 'start-campaign') {
    return NextResponse.json({ campaign: await startAdCampaign(body.campaignId) })
  }

  return NextResponse.json({ error: 'Unknown management action.' }, { status: 400 })
}
