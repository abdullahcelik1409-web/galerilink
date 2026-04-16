-- İlan taslağı oluşturmak için güvenli RPC (Extension Key ile)
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

  -- 2. İlanı ekle (Mükerrer kontrolü table level UNIQUE constraint ile sağlanıyor)
  INSERT INTO public.cars_drafts (
    seller_id,
    ilan_no,
    title,
    brand,
    model,
    year,
    km,
    price,
    expertise,
    images
  ) VALUES (
    v_seller_id,
    draft_data->>'ilan_no',
    draft_data->>'title',
    draft_data->>'brand',
    draft_data->>'model',
    (draft_data->>'year')::INTEGER,
    (draft_data->>'km')::INTEGER,
    draft_data->>'price',
    (draft_data->>'expertise')::JSONB,
    ARRAY(SELECT jsonb_array_elements_text(draft_data->'images'))
  )
  RETURNING jsonb_build_object('id', id, 'ilan_no', ilan_no) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Bu ilan zaten sistemde mevcut.';
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
