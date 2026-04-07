const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testRPCs() {
  console.log('Testing fetch_opportunities...');
  const { data: opps, error: err1 } = await supabase.rpc('fetch_opportunities');
  if (err1) console.error('fetch_opportunities error:', err1.message);
  else console.log('fetch_opportunities works!');

  console.log('\nTesting fetch_cars_optimized...');
  const { data: cars, error: err2 } = await supabase.rpc('fetch_cars_optimized', { p_user_id: '00000000-0000-0000-0000-000000000000' });
  if (err2) console.error('fetch_cars_optimized error:', err2.message);
  else {
    console.log('fetch_cars_optimized works!');
    if (cars.length > 0) {
      console.log('Columns in results:', Object.keys(cars[0]));
    }
  }
}

testRPCs();
