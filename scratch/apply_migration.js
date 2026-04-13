const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
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

-- Note: In postgres, simple views are automatically updatable.
GRANT SELECT, UPDATE, DELETE ON public.pending_taxonomy TO authenticated, service_role;
`;

async function applyMigration() {
    console.log("Applying Migration...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    console.log("Result:", data, "Error:", error);
}

applyMigration();
