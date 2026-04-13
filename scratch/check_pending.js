const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xqivvgnzrikwcavcxjsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c'
);

async function check() {
  const { data, error } = await supabase
    .from('car_taxonomy')
    .select('id, name, level, status, parent_id')
    .eq('status', 'pending');
    
  console.log("Error:", error);
  console.log("Pending items count:", data ? data.length : 0);
  console.log(data);
}
check();
