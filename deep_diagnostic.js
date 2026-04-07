const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deepDiagnostic() {
  console.log('--- DEEP DIAGNOSTIC START ---');

  // 1. Fetch a real user ID to test with
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const testUserId = users?.[0]?.id;
  console.log('Using Test User ID:', testUserId || 'NONE');

  // 2. Test fetch_opportunities
  console.log('\n--- Testing fetch_opportunities ---');
  const { data: opps, error: err1 } = await supabase.rpc('fetch_opportunities');
  if (err1) {
    console.log('ERROR MESSAGE:', err1.message);
    console.log('ERROR DETAILS:', err1.details);
    console.log('ERROR HINT:', err1.hint);
    console.log('ERROR CODE:', err1.code);
  } else {
    console.log('SUCCESS! Count:', opps.length);
  }

  // 3. Test fetch_cars_optimized
  if (testUserId) {
    console.log('\n--- Testing fetch_cars_optimized ---');
    const { data: cars, error: err2 } = await supabase.rpc('fetch_cars_optimized', { p_user_id: testUserId });
    if (err2) {
      console.log('ERROR MESSAGE:', err2.message);
      console.log('ERROR DETAILS:', err2.details);
      console.log('ERROR HINT:', err2.hint);
      console.log('ERROR CODE:', err2.code);
    } else {
      console.log('SUCCESS! Count:', cars.length);
    }
  }

  console.log('\n--- DEEP DIAGNOSTIC END ---');
}

deepDiagnostic();
