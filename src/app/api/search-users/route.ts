import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Remove @ prefix if present
    const cleanQuery = query.replace(/^@/, '').toLowerCase()

    // Use PostgreSQL full-text search with trigram similarity for fuzzy matching
    // This provides O(log n) performance with GIN indexes
    const { data: results, error } = await supabase
      .rpc('search_profiles', {
        search_query: cleanQuery,
        result_limit: 10
      })

    if (error) {
      // Fallback to basic ILIKE search if RPC function doesn't exist yet
      const { data: fallbackResults } = await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url, verified, account_type')
        .or(`handle.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
        .limit(10)

      return NextResponse.json({ results: fallbackResults || [] })
    }

    return NextResponse.json({ results: results || [] })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
