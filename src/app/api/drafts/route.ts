import { NextResponse } from 'next/server'
import { getDrafts } from '@/lib/store'

export async function GET() {
  const drafts = await getDrafts()
  return NextResponse.json(drafts)
}
