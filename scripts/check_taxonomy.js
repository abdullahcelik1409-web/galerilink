const { supabaseAdmin } = require('./utils/supabase-admin');

async function checkTaxonomy() {
  console.log('car_taxonomy tablosunu kontrol ediyorum...\n');

  // Toplam kayıt sayısı
  const { count } = await supabaseAdmin
    .from('car_taxonomy')
    .select('*', { count: 'exact', head: true });
  console.log(`Toplam kayıt sayısı: ${count}\n`);

  // Level bazında dağılım
  const { data: allData } = await supabaseAdmin
    .from('car_taxonomy')
    .select('level');
  
  if (allData) {
    const levelCounts = {};
    allData.forEach(row => {
      levelCounts[row.level] = (levelCounts[row.level] || 0) + 1;
    });
    console.log('Level bazında dağılım:');
    Object.entries(levelCounts).sort().forEach(([level, cnt]) => {
      console.log(`  ${level}: ${cnt}`);
    });
  }

  // Son eklenen 15 kayıt
  const { data: recent } = await supabaseAdmin
    .from('car_taxonomy')
    .select('name, level, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  console.log('\nSon eklenen 15 kayıt:');
  if (recent) {
    recent.forEach(r => {
      console.log(`  [${r.level}] ${r.name}  (${new Date(r.created_at).toLocaleString('tr-TR')})`);
    });
  }
}

checkTaxonomy();
