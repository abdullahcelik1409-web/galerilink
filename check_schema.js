const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkColumns() {
  console.log('Checking columns in public.cars...');
  const { data, error } = await supabase.from('cars').select('*').limit(1);
  if (error) console.error('Column check error:', error.message);
  else {
    if (data.length > 0) {
      console.log('Existing columns in cars table:', Object.keys(data[0]));
    } else {
      console.log('No data in cars table, checking profiles...');
      const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
      if (pData && pData.length > 0) {
         console.log('Existing columns in profiles table:', Object.keys(pData[0]));
      }
    }
  }
}

checkColumns();
