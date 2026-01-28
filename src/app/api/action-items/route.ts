import { NextResponse } from 'next/server'
import { getActionItems } from '@/lib/store'

export async function GET() {
  const items = await getActionItems()
  return NextResponse.json(items)
}
