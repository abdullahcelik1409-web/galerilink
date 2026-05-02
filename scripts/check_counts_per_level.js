const { supabaseAdmin } = require('./utils/supabase-admin');

async function checkLevelCounts() {
  const levels = ['kategori', 'yil', 'marka', 'seri', 'yakit', 'kasa', 'sanziman', 'model', 'motor', 'paket'];
  
  console.log('Checking counts for each level...');
  for (const level of levels) {
    const { count, error } = await supabaseAdmin
      .from('car_taxonomy')
      .select('*', { count: 'exact', head: true })
      .eq('level', level);
    
    if (error) {
      console.error(`Error checking ${level}:`, error.message);
    } else {
      console.log(`  ${level}: ${count}`);
    }
  }
  
  // Also check if there's any other level
  const { data: others } = await supabaseAdmin
    .from('car_taxonomy')
    .select('level')
    .not('level', 'in', `(${levels.join(',')})`)
    .limit(10);
    
  if (others && others.length > 0) {
    console.log('Other levels found:', [...new Set(others.map(o => o.level))]);
  }
}

checkLevelCounts();
