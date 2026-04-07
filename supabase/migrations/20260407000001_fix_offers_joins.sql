-- ============================================================
-- OFFERS TABLOSU İLİŞKİ DÜZELTMELERİ
-- ============================================================

-- PostgREST join'lerinin public şemada çalışabilmesi için 
-- bidder_id ve owner_id FK'larını auth.users'dan public.profiles'a taşıyoruz.

ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_bidder_id_fkey,
  DROP CONSTRAINT IF EXISTS offers_owner_id_fkey;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_bidder_id_fkey 
  FOREIGN KEY (bidder_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT offers_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure listing_id constraint is also well-named for clarity
ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_listing_id_fkey;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_listing_id_fkey 
  FOREIGN KEY (listing_id) REFERENCES public.cars(id) ON DELETE CASCADE;

-- ============================================================
-- RLS POLİTİKALARI (Security)
-- ============================================================

-- RLS Aktif Et
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 1. Insert: Tüm giriş yapan kullanıcılar teklif verebilir
CREATE POLICY "authenticated_can_insert_offers" 
  ON public.offers FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = bidder_id);

-- 2. Select: Sadece teklifi veren veya ilan sahibi görebilir
CREATE POLICY "users_can_see_own_or_received_offers" 
  ON public.offers FOR SELECT 
  TO authenticated 
  USING (auth.uid() = bidder_id OR auth.uid() = owner_id);

-- 3. Update: Sadece ilan sahibi teklifi Kabul/Red yapabilir
CREATE POLICY "owners_can_update_offer_status" 
  ON public.offers FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 4. Delete: Sadece teklifi veren silebilir (Kendi teklifini geri çekme)
CREATE POLICY "bidders_can_delete_own_offers" 
  ON public.offers FOR DELETE 
  TO authenticated 
  USING (auth.uid() = bidder_id);
