-- 1. Profiles tablosuna eksik kolonları ekle (Eğer yoksa)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS yetki_belge_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vergi_levhasi_url TEXT;

-- 2. Kullanıcıların KENDİ profillerini güncelleyebilmesi için RLS politikasını ekle
-- Not: Kayıt sırasında oluşan 'beklemede' durumunu kullanıcılar kendisi güncelleyebilmeli
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Storage 'verifications' bucket izinlerini düzenle (Admin okuyabilsin diye)
-- Not: Admin e-postası abdullah.celik1409@gmail.com ise tüm dosyaları görebilsin
DROP POLICY IF EXISTS "Admin can view all verification docs" ON storage.objects;
CREATE POLICY "Admin can view all verification docs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verifications' AND 
  (auth.jwt() ->> 'email') = 'abdullah.celik1409@gmail.com'
);

-- 4. Kullanıcıların kendi dosyalarını yüklemesi için izin (Zaten varsa hata vermez)
DROP POLICY IF EXISTS "Users can upload their own docs" ON storage.objects;
CREATE POLICY "Users can upload their own docs" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'verifications' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
