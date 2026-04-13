import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface TaxonomyNode {
  id: string
  parent_id: string | null
  name: string
  level: string
  slug?: string
  logo_url?: string
}

const globalForTaxonomy = globalThis as unknown as {
  taxonomyCache: Map<string, TaxonomyNode> | null;
  taxonomyCacheTimestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 mins

export const getServerTaxonomyMap = cache(async (): Promise<Map<string, TaxonomyNode>> => {
  const now = Date.now();
  if (globalForTaxonomy.taxonomyCache && globalForTaxonomy.taxonomyCacheTimestamp && (now - globalForTaxonomy.taxonomyCacheTimestamp) < CACHE_TTL) {
    return globalForTaxonomy.taxonomyCache;
  }

  const supabase = await createClient()
  const map = new Map<string, TaxonomyNode>()
  let hasMore = true
  let offset = 0
  const limit = 1000

  while (hasMore) {
    const { data, error } = await supabase
      .from('car_taxonomy')
      .select('id, parent_id, name, level, slug, logo_url')
      .eq('status', 'approved')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Server Taxonomy cache fetch error:', error)
      return globalForTaxonomy.taxonomyCache || new Map<string, TaxonomyNode>()
    }

    if (data && data.length > 0) {
      data.forEach((node: any) => map.set(node.id, node))
      if (data.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    } else {
      hasMore = false
    }
  }

  globalForTaxonomy.taxonomyCache = map;
  globalForTaxonomy.taxonomyCacheTimestamp = Date.now();
  return map;
});

export const getPackageAncestry = async (packageId: string | null) => {
  if (!packageId) return []
  const map = await getServerTaxonomyMap()
  const path: any[] = []
  let currentId: string | null | undefined = packageId
  while (currentId && map.has(currentId)) {
    const node = map.get(currentId)
    if (node) {
      path.unshift(node)
      currentId = node.parent_id
    } else {
      currentId = null
    }
  }
  return path
}
