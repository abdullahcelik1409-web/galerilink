-- ============================================================
-- FIRSAT HAVUZU & TEKLİF SİSTEMİ MİGRATION
-- ============================================================

-- 1. CARS TABLOSUNA YENİ SÜTUNLAR
-- ============================================================
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS is_opportunity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opportunity_reason TEXT CHECK (
  opportunity_reason IS NULL OR 
  opportunity_reason IN ('Nakit İhtiyacı', 'Stok Yenileme', 'Dükkan Değişikliği', 'Diğer')
),
ADD COLUMN IF NOT EXISTS opportunity_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trade_closed BOOLEAN DEFAULT true;

-- 2. OFFERS TABLOSU
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  bidder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL CHECK (amount > 0),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Realtime için offers tablosunu ekle
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

-- 3. PERFORMANS İNDEKSLERİ
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cars_opportunity 
  ON public.cars (is_opportunity) WHERE is_opportunity = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_cars_opportunity_expires 
  ON public.cars (opportunity_expires_at) WHERE is_opportunity = true;

CREATE INDEX IF NOT EXISTS idx_offers_listing 
  ON public.offers (listing_id);

CREATE INDEX IF NOT EXISTS idx_offers_bidder 
  ON public.offers (bidder_id);

CREATE INDEX IF NOT EXISTS idx_offers_owner 
  ON public.offers (owner_id);

-- Spam engeli: Bir kullanıcı aynı ilana max 3 teklif verebilir
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_spam_guard
  ON public.offers (listing_id, bidder_id, created_at);

-- 4. TRIGGER: is_opportunity=true → is_trade_closed=true OTOMATİK
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_trade_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_opportunity = true THEN
    NEW.is_trade_closed := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_trade_closed ON public.cars;
CREATE TRIGGER trg_enforce_trade_closed
  BEFORE INSERT OR UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_trade_closed();

-- 5. FONKSİYON: Süresi dolan fırsatları kapat (query-time check)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_expire_opportunities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.cars
  SET is_opportunity = false
  WHERE is_opportunity = true
    AND opportunity_expires_at IS NOT NULL
    AND opportunity_expires_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_expire_opportunities() TO authenticated;

-- 6. TEKLİF SPAM ENGELİ: Aynı kullanıcı aynı ilana max 3 teklif
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_check_offer_limit()
RETURNS TRIGGER AS $$
DECLARE
  offer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO offer_count
  FROM public.offers
  WHERE listing_id = NEW.listing_id
    AND bidder_id = NEW.bidder_id;

  IF offer_count >= 3 THEN
    RAISE EXCEPTION 'Bu ilana en fazla 3 teklif verebilirsiniz.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_offer_limit ON public.offers;
CREATE TRIGGER trg_check_offer_limit
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_offer_limit();

-- 7. RLS POLİTİKALARI (OFFERS)
-- ============================================================
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Teklif veren kendi tekliflerini görsün
CREATE POLICY "Bidders can view own offers"
  ON public.offers FOR SELECT
  USING (auth.uid() = bidder_id);

-- Araç sahibi kendi aracına gelen teklifleri görsün
CREATE POLICY "Owners can view offers on their listings"
  ON public.offers FOR SELECT
  USING (auth.uid() = owner_id);

-- Sadece giriş yapmış VE ONAYLI kullanıcılar teklif ekleyebilsin
CREATE POLICY "Approved users can insert offers"
  ON public.offers FOR INSERT
  WITH CHECK (
    auth.uid() = bidder_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND hesap_durumu = 'onaylandi'
    )
  );

-- Araç sahibi teklifleri kabul/reddet edebilsin
CREATE POLICY "Owners can update offer status"
  ON public.offers FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 8. FETCH_CARS_OPTIMIZED RPC GÜNCELLEMESİ
-- ============================================================
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
DECLARE
  v_user_city TEXT;
  v_user_district TEXT;
BEGIN
  -- Önce süresi dolmuş fırsatları kapat
  PERFORM fn_expire_opportunities();

  -- Kullanıcı lokasyonunu al
  SELECT prof.city, prof.district 
  INTO v_user_city, v_user_district
  FROM public.profiles prof
  WHERE prof.id = p_user_id;

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
    AND c.location_city = v_user_city
  ORDER BY 
    c.is_opportunity DESC,
    (c.location_district = v_user_district) DESC,
    c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_cars_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_cars_optimized(UUID) TO service_role;

-- 9. FIRSAT HAVUZU İLANLARINI ÇEKEN RPC (Tüm şehirler)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fetch_opportunities()
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
  masked_slug UUID,
  offer_count BIGINT
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
    c.masked_slug,
    (SELECT COUNT(*) FROM public.offers o WHERE o.listing_id = c.id)::BIGINT AS offer_count
  FROM public.cars c
  LEFT JOIN public.profiles p ON c.seller_id = p.id
  WHERE c.is_active = true
    AND c.is_opportunity = true
    AND (c.opportunity_expires_at IS NULL OR c.opportunity_expires_at > now())
  ORDER BY 
    c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_opportunities() TO authenticated;
