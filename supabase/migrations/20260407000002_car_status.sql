-- ============================================================
-- ARAÇ DURUMU (STATUS) SİSTEMİ
-- ============================================================

-- Cars tablosuna 'status' sütunu ekle (active, reserved, sold)
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold'));

-- Performans için indeks
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);

-- Satılmış araçları varsayılan filtrelerden gizlemek için 
-- is_active mantığına entegre edilebilir veya status üzerinden gidilir.
-- Şimdilik status='sold' olanları vitrinden manuel filtreleyeceğiz.
