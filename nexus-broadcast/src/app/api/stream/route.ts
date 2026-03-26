import { getPlatformSnapshot } from '@/lib/nexus-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function encoderData(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
}

export async function GET() {
  const encoder = new TextEncoder()
  let interval: NodeJS.Timeout | undefined

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        void getPlatformSnapshot().then((snapshot) => {
          controller.enqueue(encoder.encode(encoderData('snapshot', snapshot)))
        })
      }

      send()
      interval = setInterval(send, 5000)
    },
    cancel() {
      if (interval) {
        clearInterval(interval)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
