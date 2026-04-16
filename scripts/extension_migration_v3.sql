-- public.cars_drafts tablosunu geliştir
ALTER TABLE public.cars_drafts 
ADD COLUMN IF NOT EXISTS series TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_district TEXT,
ADD COLUMN IF NOT EXISTS fuel TEXT,
ADD COLUMN IF NOT EXISTS transmission TEXT,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS engine_size TEXT,
ADD COLUMN IF NOT EXISTS engine_power TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- RPC Fonksiyonunu Güncelle (Versiyon 3)
CREATE OR REPLACE FUNCTION public.create_car_draft_with_key(
  key_input UUID,
  draft_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_seller_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Key doğrula ve seller_id al
  SELECT id INTO v_seller_id 
  FROM public.profiles 
  WHERE extension_key = key_input;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Geçersiz Extension Key';
  END IF;

  -- 2. İlanı ekle
  INSERT INTO public.cars_drafts (
    seller_id,
    ilan_no,
    title,
    brand,
    model,
    series,
    year,
    km,
    price,
    expertise,
    images,
    location_city,
    location_district,
    fuel,
    transmission,
    body_type,
    engine_size,
    engine_power,
    description
  ) VALUES (
    v_seller_id,
    draft_data->>'ilan_no',
    draft_data->>'title',
    draft_data->>'brand',
    draft_data->>'model',
    draft_data->>'series',
    (NULLIF(draft_data->>'year', ''))::INTEGER,
    (NULLIF(draft_data->>'km', ''))::INTEGER,
    draft_data->>'price',
    (draft_data->>'expertise')::JSONB,
    ARRAY(SELECT jsonb_array_elements_text(draft_data->'images')),
    draft_data->>'location_city',
    draft_data->>'location_district',
    draft_data->>'fuel',
    draft_data->>'transmission',
    draft_data->>'body_type',
    draft_data->>'engine_size',
    draft_data->>'engine_power',
    draft_data->>'description'
  )
  RETURNING jsonb_build_object('id', id, 'ilan_no', ilan_no) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    -- Eğer önceden varsa güncelle (id'yi koru, created_at güncelle)
    UPDATE public.cars_drafts SET
      title = draft_data->>'title',
      brand = draft_data->>'brand',
      model = draft_data->>'model',
      series = draft_data->>'series',
      year = (NULLIF(draft_data->>'year', ''))::INTEGER,
      km = (NULLIF(draft_data->>'km', ''))::INTEGER,
      price = draft_data->>'price',
      expertise = (draft_data->>'expertise')::JSONB,
      images = ARRAY(SELECT jsonb_array_elements_text(draft_data->'images')),
      location_city = draft_data->>'location_city',
      location_district = draft_data->>'location_district',
      fuel = draft_data->>'fuel',
      transmission = draft_data->>'transmission',
      body_type = draft_data->>'body_type',
      engine_size = draft_data->>'engine_size',
      engine_power = draft_data->>'engine_power',
      description = draft_data->>'description',
      created_at = NOW()
    WHERE seller_id = v_seller_id AND ilan_no = draft_data->>'ilan_no'
    RETURNING jsonb_build_object('id', id, 'ilan_no', ilan_no) INTO v_result;
    
    RETURN v_result;
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
