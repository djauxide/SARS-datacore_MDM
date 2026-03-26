import { NextResponse } from 'next/server'
import { getUsers } from '@/lib/nexus-db'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ users: await getUsers() })
}
