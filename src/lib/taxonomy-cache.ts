"use client"

import { createClient } from '@/lib/supabase/client'

interface TaxonomyNode {
  id: string
  parent_id: string | null
  name: string
  level: string
}

// ⚡ Perf: Singleton taxonomy cache — fetched once, reused across navigations
let taxonomyCache: Map<string, TaxonomyNode> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let pendingFetch: Promise<Map<string, TaxonomyNode>> | null = null

export async function getTaxonomyMap(): Promise<Map<string, TaxonomyNode>> {
  const now = Date.now()

  // Return cached version if still fresh
  if (taxonomyCache && (now - cacheTimestamp) < CACHE_TTL) {
    return taxonomyCache
  }

  // Deduplicate concurrent requests — if a fetch is already in progress, wait for it
  if (pendingFetch) {
    return pendingFetch
  }

  pendingFetch = (async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('car_taxonomy')
        .select('id, parent_id, name, level')

      if (error) {
        console.error('Taxonomy cache fetch error:', error)
        return taxonomyCache || new Map()
      }

      const map = new Map<string, TaxonomyNode>()
      data?.forEach((node: any) => map.set(node.id, node))

      taxonomyCache = map
      cacheTimestamp = Date.now()
      return map
    } finally {
      pendingFetch = null
    }
  })()

  return pendingFetch
}

export function invalidateTaxonomyCache() {
  taxonomyCache = null
  cacheTimestamp = 0
}
