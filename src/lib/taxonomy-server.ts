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

import { unstable_cache } from 'next/cache'

// 1. Vercel Data Cache'den array çeken fonksiyon (24 Saat Önbellek)
const fetchTaxonomyNodesCached = unstable_cache(
  async () => {
    const supabase = await createClient()
    const allNodes: TaxonomyNode[] = []
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
        break; // Return what we have so far
      }

      if (data && data.length > 0) {
        allNodes.push(...data)
        if (data.length < limit) {
          hasMore = false
        } else {
          offset += limit
        }
      } else {
        hasMore = false
      }
    }
    return allNodes
  },
  ['galerilink-taxonomy-nodes'],
  { revalidate: 86400, tags: ['taxonomy'] } // 24 hours
)

// 2. React Request Cache ile Map'e çevrim (Sadece o anki render için)
export const getServerTaxonomyMap = cache(async (): Promise<Map<string, TaxonomyNode>> => {
  const nodes = await fetchTaxonomyNodesCached();
  const map = new Map<string, TaxonomyNode>()
  nodes.forEach(node => map.set(node.id, node))
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
