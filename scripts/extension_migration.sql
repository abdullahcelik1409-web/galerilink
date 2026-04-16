-- Profiles tablosuna extension_key ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extension_key UUID DEFAULT gen_random_uuid();

-- Cars Drafts tablosu
CREATE TABLE IF NOT EXISTS public.cars_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ilan_no TEXT NOT NULL,
  title TEXT,
  brand TEXT,
  model TEXT,
  year INTEGER,
  km INTEGER,
  price TEXT,
  expertise JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, ilan_no)
);

-- RLS
ALTER TABLE public.cars_drafts ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi taslaklarını görebilir ve yönetebilir
CREATE POLICY "Users can manage their own drafts" ON public.cars_drafts
  FOR ALL USING (auth.uid() = seller_id);

-- API Key Doğrulama Fonksiyonu
CREATE OR REPLACE FUNCTION public.validate_extension_key(key_input UUID)
RETURNS TABLE(profile_id UUID, g_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT id, company_name
  FROM public.profiles
  WHERE extension_key = key_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
