-- 1. Performans İçin İndekslerin Oluşturulması
CREATE INDEX IF NOT EXISTS idx_cars_location_city ON public.cars (location_city) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cars_location_district ON public.cars (location_district) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cars_created_at_desc ON public.cars (created_at DESC);

-- 2. Optimize Edilmiş Veri Çekme Fonksiyonu (RPC)
-- Ambiguity hatasını gidermek için tablo alias (prof) eklendi
CREATE OR REPLACE FUNCTION public.fetch_cars_optimized(p_user_id UUID)
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
  seller_phone TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_city TEXT;
  v_user_district TEXT;
BEGIN
  -- Giriş yapan kullanıcının profilinden şehir ve ilçe bilgilerini al
  -- prof.id kullanarak 'id' kolonunun belirsizliğini (ambiguity) gideriyoruz
  SELECT prof.city, prof.district 
  INTO v_user_city, v_user_district
  FROM public.profiles prof
  WHERE prof.id = p_user_id;

  -- İlişkili tabloları birleştir, filtrele ve sırala
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
    p.phone
  FROM public.cars c
  LEFT JOIN public.profiles p ON c.seller_id = p.id
  WHERE c.is_active = true
    AND c.location_city = v_user_city
  ORDER BY 
    (c.location_district = v_user_district) DESC,
    c.created_at DESC;
END;
$$;

-- 3. Erişim Yetkilerinin Tanımlanması
GRANT EXECUTE ON FUNCTION public.fetch_cars_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_cars_optimized(UUID) TO service_role;