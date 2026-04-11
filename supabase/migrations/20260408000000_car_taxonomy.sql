-- 1. Create Car Taxonomy Table (N-Level Hierarchy)
CREATE TABLE IF NOT EXISTS public.car_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.car_taxonomy(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('category', 'year', 'brand', 'series', 'fuel', 'body', 'transmission', 'engine', 'package')),
    logo_url TEXT, -- Used for 'brand' level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, name)
);

-- Index for traversal across hierarchy levels
CREATE INDEX IF NOT EXISTS idx_car_taxonomy_parent ON public.car_taxonomy(parent_id);
CREATE INDEX IF NOT EXISTS idx_car_taxonomy_level ON public.car_taxonomy(level);
CREATE INDEX IF NOT EXISTS idx_car_taxonomy_slug ON public.car_taxonomy(slug);

-- 2. Create Car Packages Table (Extra details for the leaf node)
CREATE TABLE IF NOT EXISTS public.car_packages (
    id UUID PRIMARY KEY REFERENCES public.car_taxonomy(id) ON DELETE CASCADE,
    hp INTEGER,
    engine_size INTEGER,
    production_years TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Existing Cars Table
-- Add package_id to link to the taxonomy leaf node
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='package_id') THEN
        ALTER TABLE public.cars ADD COLUMN package_id UUID REFERENCES public.car_taxonomy(id);
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.car_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_packages ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to taxonomy') THEN
        CREATE POLICY "Allow public read access to taxonomy" ON public.car_taxonomy FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to packages') THEN
        CREATE POLICY "Allow public read access to packages" ON public.car_packages FOR SELECT USING (true);
    END IF;
END $$;

-- 6. Storage Bucket for Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand_logos', 'brand_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public bucket
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'brand_logos');
    END IF;
END $$;
