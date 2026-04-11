const { supabaseAdmin } = require('./utils/supabase-admin');

// Kullanıcının "alakasız" bulduğu Peugeot yeni kalkan logosu yerine -> Klasik Bilinen Aslan (Vector)
// Nissan eski kalitesiz logo yerine -> Yeni temiz vektörel logo (Nissan 2020)
const FIXED_LOGOS = {
  'nissan': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg',
  'peugeot': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg'
};

async function fixLogos() {
  console.log("Hatalı (Alakasız) logolar düzeltiliyor...");
  
  for (const [brand, logoUrl] of Object.entries(FIXED_LOGOS)) {
    const { error } = await supabaseAdmin
      .from('car_taxonomy')
      .update({ logo_url: logoUrl })
      .eq('slug', brand)
      .eq('level', 'brand');

    if (error) {
      console.error(`❌ ${brand} güncellenirken hata:`, error.message);
    } else {
      console.log(`✅ ${brand} logosu istenen daha tanınır versiyonuyla güncellendi!`);
    }
  }
}

fixLogos();
