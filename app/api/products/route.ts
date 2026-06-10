import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  // Reject suspiciously long or clearly invalid queries
  if (q.length > 100) return NextResponse.json([], { status: 400 })

  try {
    const { data, error } = await createClient()
      .from('products')
      .select('name, category')
      .eq('is_available', true)
      .ilike('name', `%${q}%`)
      .order('search_count', { ascending: false })
      .limit(6)

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
