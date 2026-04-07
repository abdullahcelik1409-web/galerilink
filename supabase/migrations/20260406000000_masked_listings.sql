-- Create masked_slug column and index
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS masked_slug UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_masked_slug ON public.cars (masked_slug);

-- Function to get masked listing
CREATE OR REPLACE FUNCTION public.fn_get_masked_listing(p_masked_slug UUID)
RETURNS TABLE (
  brand TEXT,
  model TEXT,
  year INTEGER,
  km INTEGER,
  damage_report TEXT,
  images TEXT[],
  title TEXT,
  expertise JSONB,
  location_city TEXT,
  location_district TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.brand,
    c.model,
    c.year,
    c.km,
    c.damage_report,
    c.images,
    c.title,
    c.expertise,
    c.location_city,
    c.location_district
  FROM public.cars c
  WHERE c.masked_slug = p_masked_slug AND c.is_active = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_masked_listing(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_get_masked_listing(UUID) TO authenticated;
