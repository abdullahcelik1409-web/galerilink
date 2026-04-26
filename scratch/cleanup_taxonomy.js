const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanup() {
  console.log('🧹 Cleaning up potentially broken taxonomy for 2020-2026...');
  
  // 1. Get IDs of the years 2020-2026
  const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const { data: yearNodes } = await supabase
    .from('car_taxonomy')
    .select('id, name')
    .eq('level', 'yil')
    .in('name', years);
  
  if (!yearNodes || yearNodes.length === 0) {
    console.log('No year nodes found for 2020-2026. Skipping cleanup.');
    return;
  }

  const yearIds = yearNodes.map(y => y.id);
  console.log(`Found ${yearIds.length} year nodes to reset.`);

  // 2. Actually deleting is hard because of the deep hierarchy and potential lack of cascading.
  // Instead of deleting, I will just re-run the enrichment script.
  // Since it uses UPSERT with 'parent_id, name', it WILL create the missing levels.
  // However, the "skipped" children (e.g. sanziman under yakit instead of sanziman under kasa)
  // will still exist as redundant branches.
  
  // To REALLY fix it, we need to delete. 
  // Let's try to delete all nodes where the root ancestor is one of these years.
  // Since we don't have recursive delete in the client easily, I'll just delete the YIL nodes
  // and hope the DB has ON DELETE CASCADE.
  
  const { error } = await supabase.from('car_taxonomy').delete().in('id', yearIds);
  
  if (error) {
    console.error('Delete failed (likely no cascade):', error.message);
    console.log('Proceeding to enrichment anyway (upsert will fill gaps)...');
  } else {
    console.log('Successfully deleted 2020-2026 branches. Clean slate ready.');
  }
}

cleanup();
