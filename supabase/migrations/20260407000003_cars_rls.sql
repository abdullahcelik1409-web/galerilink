-- ============================================================
-- CARS TABLOSU RLS POLİTİKALARI
-- ============================================================

-- RLS'yi etkinleştir
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Herkes (Giriş yapmış) tüm aktif ilanları görebilir
CREATE POLICY "Authenticated users can view active cars"
  ON public.cars FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. INSERT: Giriş yapmış herkes ilan ekleyebilir
CREATE POLICY "Authenticated users can insert cars"
  ON public.cars FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- 3. UPDATE: Sadece ilan sahibi kendi ilanını güncelleyebilir
-- Bu politika 'Finished Sale' (Satışı Bitir) işlemini mümkün kılar
CREATE POLICY "Owners can update own cars"
  ON public.cars FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 4. DELETE: Sadece ilan sahibi kendi ilanını silebilir
CREATE POLICY "Owners can delete own cars"
  ON public.cars FOR DELETE
  USING (auth.uid() = seller_id);
