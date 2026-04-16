-- car_images bucket'ı için Silme (DELETE) izni
-- Bu izin sayesinde kullanıcılar taslakları sildiğinde resimlerini de temizleyebilir.

CREATE POLICY "Galerilink_Kullanıcı_Silme" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'car_images');
