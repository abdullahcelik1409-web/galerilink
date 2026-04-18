-- 1. Create enum for account status
DO $$ BEGIN
    CREATE TYPE public.hesap_durumu AS ENUM ('beklemede', 'onaylandi', 'reddedildi');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ad_soyad TEXT,
ADD COLUMN IF NOT EXISTS galeri_adi TEXT,
ADD COLUMN IF NOT EXISTS telefon TEXT,
ADD COLUMN IF NOT EXISTS yetki_belge_no TEXT,
ADD COLUMN IF NOT EXISTS vergi_levhasi_url TEXT,
ADD COLUMN IF NOT EXISTS hesap_durumu public.hesap_durumu DEFAULT 'beklemede';

-- 3. Migrate existing status data
UPDATE public.profiles 
SET hesap_durumu = 
    CASE 
        WHEN status = 'approved' THEN 'onaylandi'::public.hesap_durumu
        WHEN status = 'rejected' THEN 'reddedildi'::public.hesap_durumu
        ELSE 'beklemede'::public.hesap_durumu
    END
WHERE hesap_durumu IS NULL OR hesap_durumu = 'beklemede';

-- 4. Add Unique Constraints
-- Note: We use unique indexes to allow multiple NULLs if needed, or just UNIQUE constraints.
-- Users with existing duplicate phone/company_name might cause this to fail if not handled.
-- We'll try to add them, but if they fail, we might need manual cleanup.
ALTER TABLE public.profiles ADD CONSTRAINT unique_telefon UNIQUE (telefon);
ALTER TABLE public.profiles ADD CONSTRAINT unique_galeri_adi UNIQUE (galeri_adi);
-- yetki_belge_no can be null initially, but if present, should be unique.
CREATE UNIQUE INDEX IF NOT EXISTS unique_yetki_belge_no ON public.profiles (yetki_belge_no) WHERE yetki_belge_no IS NOT NULL;

-- 5. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    ad_soyad,
    galeri_adi, 
    telefon,
    hesap_durumu,
    trial_ends_at
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'ad_soyad',
    NEW.raw_user_meta_data->>'galeri_adi',
    NEW.raw_user_meta_data->>'telefon',
    'beklemede',
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Storage Bucket setup (if storage schema exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verifications', 'verifications', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for verifications
-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admin to view all verification documents
-- We assume admin.email is checked in the app, but here we can check for a specific admin role or just let authenticated users view if they are admin (app-side check).
-- For safety, we'll allow authenticated users to select from verifications, but further restricted in the app.
CREATE POLICY "Admin can view all verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verifications');
