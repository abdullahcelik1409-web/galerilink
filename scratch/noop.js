const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xqivvgnzrikwcavcxjsi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c'
);

(async () => {
    // We cannot execute raw SQL from client directly usually, unless through Postgres functions or 'query' endpoint if admin.
    // I already have a migration file.
})();
