const { supabaseAdmin } = require('./utils/supabase-admin');

async function checkLevelCounts() {
  const { data: allData } = await supabaseAdmin
    .from('car_taxonomy')
    .select('level');
  
  if (allData) {
    const levelCounts = {};
    allData.forEach(row => {
      levelCounts[row.level] = (levelCounts[row.level] || 0) + 1;
    });
    console.log('Detailed Level Counts:');
    Object.entries(levelCounts).sort((a, b) => b[1] - a[1]).forEach(([level, cnt]) => {
      console.log(`  ${level}: ${cnt}`);
    });
  }
}

checkLevelCounts();
