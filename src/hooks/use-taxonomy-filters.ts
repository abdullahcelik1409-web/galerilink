"use client"

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TaxonomyNode {
  id: string;
  name: string;
  parent_id: string | null;
  level: string;
  logo_url?: string;
}

export function useTaxonomyFilters() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const getNodes = useCallback(async (level: string, parentId: string | null = null) => {
    setLoading(true)
    try {
      let query = supabase
        .from('car_taxonomy')
        .select('id, name, parent_id, level, logo_url')
        .eq('level', level)
        .order('name')

      // Include approved and active ones
      query = query.or('status.is.null,status.eq.approved,status.eq.active')

      if (parentId) {
        query = query.eq('parent_id', parentId)
      } else if (level === 'kategori') {
        query = query.is('parent_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      return data as TaxonomyNode[]
    } catch (err) {
      console.error(`Error fetching taxonomy for ${level}:`, err)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const getAllStandalone = useCallback(async (level: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('car_taxonomy')
        .select('id, name, parent_id, level')
        .eq('level', level)
        .or('status.is.null,status.eq.approved,status.eq.active')
        .order('name')
      
      if (error) throw error
      
      // Remove duplicates by name for standalone filters
      const unique = Array.from(new Map(data.map((item: any) => [item.name, item])).values())
      return unique as TaxonomyNode[]
    } catch (err) {
      console.error(`Error fetching standalone taxonomy for ${level}:`, err)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return { getNodes, getAllStandalone, loading }
}
