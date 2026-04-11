-- 1. Update the level constraint to include 'model'
ALTER TABLE public.car_taxonomy 
DROP CONSTRAINT IF EXISTS car_taxonomy_level_check;

ALTER TABLE public.car_taxonomy 
ADD CONSTRAINT car_taxonomy_level_check 
CHECK (level IN ('category', 'year', 'brand', 'series', 'model', 'fuel', 'body', 'transmission', 'engine', 'package'));

-- 2. Add Unique Constraint for Brands (No duplicate slugs at root level)
DROP INDEX IF EXISTS idx_unique_brand_slug;
CREATE UNIQUE INDEX idx_unique_brand_slug ON public.car_taxonomy (slug) WHERE (parent_id IS NULL);

-- 3. Add Unique Constraint for Models/Packages under same parent
DROP INDEX IF EXISTS idx_unique_child_name;
CREATE UNIQUE INDEX idx_unique_child_name ON public.car_taxonomy (parent_id, name) WHERE (parent_id IS NOT NULL);

console.log("✅ SQL Constraints updated successfully.");
