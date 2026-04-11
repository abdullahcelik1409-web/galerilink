const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  console.log("Mükerrer marka analizi başlatılıyor...");

  // 1. Tüm Markaları Çek
  const { data: brands, error } = await supabase
    .from('car_taxonomy')
    .select('*')
    .eq('level', 'brand');

  if (error) {
    console.error(error.message);
    return;
  }

  // 2. İsime Göre Grupla
  const groups = {};
  brands.forEach(b => {
    if (!groups[b.name]) groups[b.name] = [];
    groups[b.name].push(b);
  });

  console.log(`Toplam ${Object.keys(groups).length} farklı marka ismi bulundu.`);

  for (const [name, items] of Object.entries(groups)) {
    if (items.length > 1) {
      console.log(`\n- "${name}" isminden ${items.length} adet kayıt var.`);
      
      // Her birine bağlı çocuk sayısını bul
      for (const item of items) {
        const { count } = await supabase
          .from('car_taxonomy')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', item.id);
        
        console.log(`  > ID: ${item.id}, Çocuk Sayısı: ${count}`);
      }
    }
  }
}

checkDuplicates();
