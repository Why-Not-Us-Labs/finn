import { NextResponse } from 'next/server'
import { getInboxStatus, setInboxStatus } from '@/lib/store'

export async function GET() {
  const status = await getInboxStatus()
  return NextResponse.json(status)
}

export async function POST(req: Request) {
  const body = await req.json()
  const status = await getInboxStatus()
  if (body.lastReviewed !== undefined) status.lastReviewed = body.lastReviewed
  if (body.pendingCount !== undefined) status.pendingCount = body.pendingCount
  if (body.urgentCount !== undefined) status.urgentCount = body.urgentCount
  await setInboxStatus(status)
  return NextResponse.json(status)
}
