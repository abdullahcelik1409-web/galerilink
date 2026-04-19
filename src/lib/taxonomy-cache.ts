"use client"

import { createClient } from '@/lib/supabase/client'

export interface TaxonomyNode {
  id: string
  parent_id: string | null
  name: string
  level: string
  slug?: string
  logo_url?: string
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ⚡ Dynamic level-based cache to replace the global map
const levelCache: Record<string, { data: TaxonomyNode[], timestamp: number }> = {}

/**
 * Fetches children for a specific level and parent.
 * This is 1000x more efficient than fetching the entire 53k record database at once.
 */
export async function getTaxonomyChildren(level: string, parentId: string | null): Promise<TaxonomyNode[]> {
  const cacheKey = `${level}-${parentId}`
  const now = Date.now()

  // Return cached result if still fresh
  if (levelCache[cacheKey] && (now - levelCache[cacheKey].timestamp) < CACHE_TTL) {
    return levelCache[cacheKey].data
  }

  try {
    const supabase = createClient()
    let query = supabase
      .from('car_taxonomy')
      .select('id, parent_id, name, level, slug, logo_url')
      .eq('level', level)
      .eq('status', 'approved')

    if (parentId === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', parentId)
    }

    const { data, error } = await query.order('name', { ascending: level !== 'yil' })

    if (error) {
      console.error(`Error fetching taxonomy children for ${level}:`, error)
      return []
    }

    const result = data as TaxonomyNode[]
    levelCache[cacheKey] = { data: result, timestamp: now }
    return result
  } catch (err) {
    console.error(`Exception in getTaxonomyChildren for ${level}:`, err)
    return []
  }
}

/**
 * @deprecated Use getTaxonomyChildren for on-demand loading. 
 * Fetching the entire 53k database into a Map is no longer supported.
 */
export async function getTaxonomyMap(): Promise<Map<string, TaxonomyNode>> {
  console.warn('getTaxonomyMap is deprecated and returns an empty map. Use getTaxonomyChildren.')
  return new Map()
}

export function invalidateTaxonomyCache() {
  // Clear all level caches
  for (const key in levelCache) {
    delete levelCache[key]
  }
}
