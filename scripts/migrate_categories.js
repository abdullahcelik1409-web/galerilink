const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toSlug(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function migrate() {
  console.log("🚀 Veritabanı Migrasyonu Başlıyor...");

  // 1. 'status' sütunu kontrolü ve eklenmesi (Manual SQL gerekebilir ama deneyeceğiz)
  // Not: JS Client ile ALTER TABLE yapılamaz. Kullanıcıya bilgi vereceğiz veya varsa rpc deneyeceğiz.
  // Ancak 'upsert' ile status eklemeyi deneyebiliriz, eğer sütun varsa çalışır.
  
  console.log("\n1. 'Otomobil' Kategori Düğümü Oluşturuluyor...");
  const { data: catData, error: catError } = await supabase.from('car_taxonomy').upsert({
    name: "Otomobil",
    level: "kategori",
    parent_id: null,
    slug: "otomobil-kategori"
  }, { onConflict: 'parent_id, name' }).select().single();

  if (catError) {
    console.error("Critical Error: Otomobil kategorisi oluşturulamadı.", catError.message);
    return;
  }
  const otomobilId = catData.id;
  console.log(`✅ Otomobil Kategorisi ID: ${otomobilId}`);

  console.log("\n2. Mevcut Markalar 'Otomobil' Altına Taşınıyor...");
  // Tüm marka seviyesindeki kayıtları bul (parent_id null olanlar)
  const { data: brands, error: fetchError } = await supabase
    .from('car_taxonomy')
    .select('id, name')
    .eq('level', 'marka')
    .is('parent_id', null);

  if (fetchError) {
    console.error("Markalar çekilemedi:", fetchError.message);
    return;
  }

  console.log(`${brands.length} adet marka bulundu.`);

  for (const brand of brands) {
    const { error: updateError } = await supabase
      .from('car_taxonomy')
      .update({ parent_id: otomobilId })
      .eq('id', brand.id);
    
    if (updateError) {
      console.error(`! [${brand.name}] taşınırken hata:`, updateError.message);
    } else {
      process.stdout.write(".");
    }
  }

  console.log("\n\n3. Diğer Kategoriler (Ticari, Motosiklet) Hazırlanıyor...");
  await supabase.from('car_taxonomy').upsert([
    { name: "Ticari Araçlar", level: "kategori", parent_id: null, slug: "ticari-araclar-kategori" },
    { name: "Motosiklet", level: "kategori", parent_id: null, slug: "motosiklet-kategori" }
  ], { onConflict: 'parent_id, name' });

  console.log("\n✨ Migrasyon Başarıyla Tamamlandı!");
  console.log("Artık hiyerarşi 'Kategori -> Marka' şeklinde çalışmaya hazır.");
}

migrate();
