import { NextRequest, NextResponse } from 'next/server'
import { activateReceiverConnection, getPlatformSnapshot, stageReceiverConnection } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; resource: string } },
) {
  const receiverId = Number(params.id)
  const snapshot = await getPlatformSnapshot()
  const receiver = snapshot.receivers.find((item) => item.id === receiverId)

  if (!receiver) {
    return NextResponse.json({ error: 'Receiver not found.' }, { status: 404 })
  }

  if (params.resource === 'active') {
    return NextResponse.json({
      receiver_id: receiver.id,
      sender_id: receiver.activeSenderId ?? null,
      transport: receiver.transport,
      mode: receiver.activationMode,
    })
  }

  if (params.resource === 'staged') {
    return NextResponse.json({
      receiver_id: receiver.id,
      sender_id: receiver.stagedSenderId ?? null,
      transport: receiver.transport,
      mode: receiver.activationMode,
    })
  }

  if (params.resource === 'transporttype') {
    return NextResponse.json({ transport: receiver.transport })
  }

  return NextResponse.json({ error: 'Unknown NMOS connection resource.' }, { status: 404 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; resource: string } },
) {
  const receiverId = Number(params.id)

  if (params.resource !== 'staged') {
    return NextResponse.json({ error: 'Only staged receiver resources are patchable.' }, { status: 400 })
  }

  const body = (await request.json()) as {
    sender_id?: number | null
    activation?: {
      mode?: 'immediate'
    }
  }

  await stageReceiverConnection(receiverId, body.sender_id ?? undefined)

  if (body.activation?.mode === 'immediate') {
    await activateReceiverConnection(receiverId)
  }

  const snapshot = await getPlatformSnapshot()
  const receiver = snapshot.receivers.find((item) => item.id === receiverId)
  return NextResponse.json(receiver)
}
