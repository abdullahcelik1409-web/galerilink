const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').filter(l=>l.includes('=')).forEach(line => {
  const [key, ...values] = line.split('=');
  env[key.trim()] = values.join('=').trim().replace(/^"(.*)"$/, '$1');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE OR REPLACE FUNCTION public.fetch_cars_optimized(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  title TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  km INTEGER,
  price_b2b BIGINT,
  images TEXT[],
  damage_report TEXT,
  expertise JSONB,
  location_city TEXT,
  location_district TEXT,
  is_active BOOLEAN,
  seller_id UUID,
  seller_company_name TEXT,
  seller_city TEXT,
  seller_district TEXT,
  seller_phone TEXT,
  is_opportunity BOOLEAN,
  opportunity_reason TEXT,
  opportunity_expires_at TIMESTAMPTZ,
  is_trade_closed BOOLEAN,
  masked_slug UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Önce süresi dolmuş fırsatları kapat
  PERFORM fn_expire_opportunities();

  RETURN QUERY
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
    c.masked_slug
  FROM public.cars c
  LEFT JOIN public.profiles p ON c.seller_id = p.id
  WHERE c.is_active = true
  ORDER BY 
    c.is_opportunity DESC,
    c.created_at DESC;
END;
$$;
`;

async function updateRPC() {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Migration Error:', error);
    } else {
        console.log('RPC fetch_cars_optimized updated: City restriction removed.');
    }
}

updateRPC();
