-- Storage (car_images) bucket politikaları
-- NOT: car_images bucket'ının Supabase Dashboard üzerinden "Public" olarak işaretlenmiş olması gerekir.

-- 1. Herkesin resimleri görmesine izin ver
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'car_images');

-- 2. Uzantının (Anon key) resim yüklemesine izin ver
CREATE POLICY "Allow Anon Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'car_images');
