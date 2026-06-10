import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  // q=all → return the full list for client-side preload (called once on mount)
  const fetchAll = q === 'all'

  if (!fetchAll && q.length < 2) return NextResponse.json([])
  if (q.length > 100) return NextResponse.json([], { status: 400 })

  try {
    let query = createClient()
      .from('products')
      .select('name, category')
      .eq('is_available', true)
      .order('search_count', { ascending: false })

    if (!fetchAll) query = query.ilike('name', `%${q}%`).limit(6)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
