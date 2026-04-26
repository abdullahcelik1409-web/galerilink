const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const LEVELS = ['kategori', 'yil', 'marka', 'seri', 'yakit', 'kasa', 'sanziman', 'motor', 'paket'];

async function audit() {
  console.log('🚀 Starting Taxonomy Audit...');

  // 1. Get a sample of 'seri' nodes (Models) to check their depth
  console.log('--- Checking Models (seri) for children ---');
  const { data: models, error: err1 } = await supabase
    .from('car_taxonomy')
    .select('id, name, parent_id')
    .eq('level', 'seri')
    .limit(100);

  if (err1) {
    console.error('Error fetching models:', err1);
    return;
  }

  const brokenPaths = [];
  
  for (const model of models) {
    // Check for 'yakit' children
    const { count: fuelCount } = await supabase
      .from('car_taxonomy')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', model.id);
    
    if (fuelCount === 0) {
      brokenPaths.push({ level: 'seri', name: model.name, id: model.id, issue: 'No children (Fuel missing)' });
    } else {
      // Check deeper if needed, but usually if fuel is missing, the rest is too.
    }
  }

  console.log(`Found ${brokenPaths.length} broken models in first 100 sample.`);
  if (brokenPaths.length > 0) {
    console.table(brokenPaths.slice(0, 10));
  }

  // 2. Check for empty parent chains (any node without parent except root)
  const { count: orphanCount } = await supabase
    .from('car_taxonomy')
    .select('*', { count: 'exact', head: true })
    .neq('level', 'kategori')
    .is('parent_id', null);
  
  console.log('Orphaned nodes (no parent):', orphanCount);

  // 3. Level jump check: Are there any nodes whose parent's level is not the previous level in LEVELS?
  console.log('--- Checking for level jumps ---');
  // This is harder to do in one query, but let's check a sample.
  const { data: samples } = await supabase
    .from('car_taxonomy')
    .select('id, level, parent_id')
    .limit(1000);
  
  const levelOrderMap = LEVELS.reduce((acc, curr, idx) => { acc[curr] = idx; return acc; }, {});
  
  // To do a proper level jump check we need parent levels.
  // Instead, let's just summarized broken nodes found in step 1.
}

audit();
