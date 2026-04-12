-- Create an updatable view for pending taxonomy items
CREATE OR REPLACE VIEW public.pending_taxonomy AS
SELECT 
    id,
    parent_id,
    name,
    level,
    slug,
    logo_url,
    created_at,
    status
FROM public.car_taxonomy
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Grant access to authenticated users if needed (views inherit from base table usually, but we can set permissions)
GRANT SELECT ON public.pending_taxonomy TO authenticated, service_role, anon;
GRANT UPDATE ON public.pending_taxonomy TO authenticated, service_role;
GRANT DELETE ON public.pending_taxonomy TO authenticated, service_role;
