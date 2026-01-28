import { NextResponse } from 'next/server'
import { getActivity, setActivity } from '@/lib/store'

export async function GET() {
  const activity = await getActivity()
  return NextResponse.json(activity)
}

export async function POST(req: Request) {
  const body = await req.json()
  const activity = await getActivity()
  const entry = {
    id: `a${Date.now()}`,
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    text: body.text,
    icon: body.icon || '📌',
    createdAt: new Date().toISOString(),
  }
  activity.unshift(entry)
  await setActivity(activity)
  return NextResponse.json(entry)
}
