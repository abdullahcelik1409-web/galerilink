const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xqivvgnzrikwcavcxjsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c'
);

async function check() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'car_taxonomy' });
  // Instead of querying constraints which might need rpc, let's just insert 'marka' and see if it fails.
  const { error: insertError } = await supabase
    .from('car_taxonomy')
    .insert({
       name: 'TEST_MARKA_123',
       level: 'marka',
       slug: 'test-marka-1234',
       status: 'pending'
    })
    .select();
    
  console.log("Insert Error:", insertError);
}
check();
