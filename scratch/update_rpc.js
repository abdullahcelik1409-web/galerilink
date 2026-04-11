const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
-- Drop existing function if it exists with different signature if needed
-- But we'll just replace it with same parameter list

CREATE OR REPLACE FUNCTION public.fetch_opportunities()
RETURNS TABLE (
  res_id UUID,
  res_created_at TIMESTAMPTZ,
  res_title TEXT,
  res_brand TEXT,
  res_model TEXT,
  res_year INTEGER,
  res_km INTEGER,
  res_price_b2b BIGINT,
  res_images TEXT[],
  res_damage_report TEXT,
  res_expertise JSONB,
  res_location_city TEXT,
  res_location_district TEXT,
  res_is_active BOOLEAN,
  res_seller_id UUID,
  res_seller_company_name TEXT,
  res_seller_city TEXT,
  res_seller_district TEXT,
  res_seller_phone TEXT,
  res_is_opportunity BOOLEAN,
  res_opportunity_reason TEXT,
  res_opportunity_expires_at TIMESTAMPTZ,
  res_is_trade_closed BOOLEAN,
  res_masked_slug UUID,
  res_offer_count BIGINT,
  res_package_id UUID,
  res_taxonomy_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Once süresi dolmuş fırsatları kapat
  PERFORM fn_expire_opportunities();

  RETURN QUERY
  WITH RECURSIVE taxonomy_path AS (
      -- Base case: packages linked to cars
      SELECT id, parent_id, id as child_id, ARRAY[id] as path_ids
      FROM public.car_taxonomy
      WHERE level = 'paket'
      
      UNION ALL
      
      -- Recursive step: climb up the tree
      SELECT t.id, t.parent_id, tp.child_id, t.id || tp.path_ids
      FROM public.car_taxonomy t
      JOIN taxonomy_path tp ON t.id = tp.parent_id
  ),
  full_paths AS (
      -- Filter to only paths starting from root
      SELECT child_id, path_ids
      FROM taxonomy_path
      WHERE parent_id IS NULL
  )
  SELECT 
    c.id,
    c.created_at,
    c.title,
    c.brand,
    c.model,
    c.year,
    c.km,
    c.price_b2b,
    c.images,
    c.damage_report,
    c.expertise,
    c.location_city,
    c.location_district,
    c.is_active,
    c.seller_id,
    p.company_name,
    p.city,
    p.district,
    p.phone,
    c.is_opportunity,
    c.opportunity_reason,
    c.opportunity_expires_at,
    c.is_trade_closed,
    c.masked_slug,
    (SELECT COUNT(*) FROM public.offers o WHERE o.listing_id = c.id)::BIGINT AS offer_count,
    c.package_id,
    fp.path_ids
  FROM public.cars c
  LEFT JOIN public.profiles p ON c.seller_id = p.id
  LEFT JOIN full_paths fp ON c.package_id = fp.child_id
  WHERE c.is_active = true
    AND c.is_opportunity = true
    AND (c.opportunity_expires_at IS NULL OR c.opportunity_expires_at > now())
  ORDER BY 
    c.created_at DESC;
END;
$$;
`;

async function updateRPC() {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        // If exec_sql RPC doesn't exist, we can't do this easily without SQL editor access.
        // We'll try another way if it fails.
        console.error('Migration Error:', error);
    } else {
        console.log('RPC fetch_opportunities updated successfully.');
    }
}

updateRPC();
