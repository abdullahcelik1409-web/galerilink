const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeTaxonomy() {
  console.log("Veritabanı analizi başlatılıyor...");
  
  const { data: brands, error } = await supabase
    .from('car_taxonomy')
    .select('*')
    .eq('level', 'brand');

  if (error) {
    console.error("Hata:", error.message);
    return;
  }

  console.log(`Toplam ${brands.length} marka kaydı bulundu.`);

  const suspicious = brands.filter(b => b.name.includes(' ') || b.name.includes('-'));
  
  console.log(`\nŞüpheli Kayıtlar (${suspicious.length} adet):`);
  suspicious.slice(0, 20).forEach(b => {
    console.log(`- ID: ${b.id}, Ad: ${b.name}, Slug: ${b.slug}`);
  });

  if (suspicious.length > 20) {
    console.log("... ve daha fazlası.");
  }

  // Seri ve Model sayılarını da görelim
  const { count: seriesCount } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).eq('level', 'series');
  const { count: packageCount } = await supabase.from('car_taxonomy').select('*', { count: 'exact', head: true }).eq('level', 'package');

  console.log(`\nÖzet:`);
  console.log(`- Markalar: ${brands.length}`);
  console.log(`- Seriler: ${seriesCount}`);
  console.log(`- Paketler (Model): ${packageCount}`);
}

analyzeTaxonomy();
