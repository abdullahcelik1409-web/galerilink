const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
  console.log('--- Taxonomy Diagnosis ---');
  
  // 1. Total count
  const { count: total, error: err1 } = await supabase
    .from('car_taxonomy')
    .select('*', { count: 'exact', head: true });
  
  if (err1) {
    console.error('Error fetching total count:', err1);
    return;
  }
  console.log('Total rows in car_taxonomy:', total);

  // 2. Counts by Status
  const statuses = ['approved', 'pending', 'rejected', 'draft'];
  console.log('--- Counts by Status ---');
  for (const status of statuses) {
    const { count } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).eq('status', status);
    console.log(`${status}: ${count}`);
  }
  const { count: nullStatus } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).is('status', null);
  console.log(`null: ${nullStatus}`);

  // 3. Counts by Level
  const levels = ['kategori', 'yil', 'marka', 'seri', 'yakit', 'kasa', 'sanziman', 'motor', 'paket'];
  console.log('--- Counts by Level ---');
  for (const level of levels) {
    const { count } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).eq('level', level);
    console.log(`${level}: ${count}`);
  }

  // 4. Check for 'VASITA'
  const { data: vasita } = await supabase.from('car_taxonomy').select('*').ilike('name', 'VASITA');
  console.log('Items matching "VASITA":', vasita);

  // 5. Check 'Otomobil' children (Approved vs all)
  const { data: otomobil } = await supabase.from('car_taxonomy').select('id, name').eq('name', 'Otomobil').single();
  if (otomobil) {
    console.log('Otomobil ID:', otomobil.id);
    const { count: approvedChildren } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).eq('parent_id', otomobil.id).eq('status', 'approved');
    const { count: allChildren } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).eq('parent_id', otomobil.id);
    console.log('Otomobil children -> Approved:', approvedChildren, 'Total:', allChildren);
  }
}

diagnose();
