const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function totalRepair() {
  console.log("🛠️ TOTAL REPAIR & HIERARCHY FIX STARTED...");

  // 1. LEVEL STANDARDİZASYONU: 'series' -> 'model'
  console.log("\n1. Level isimleri eşitleniyor ('series' -> 'model')...");
  const { error: levelErr } = await supabase
    .from('car_taxonomy')
    .update({ level: 'model' })
    .eq('level', 'series');
  
  if (levelErr) console.error("Level güncelleme hatası:", levelErr.message);
  else console.log("✅ Tüm 'series' kayıtları 'model' olarak güncellendi.");

  // 2. MÜKERRER MARKA BİRLEŞTİRME
  console.log("\n2. Mükerrer markalar tespit ediliyor ve birleştiriliyor...");
  const { data: brands } = await supabase
    .from('car_taxonomy')
    .select('id, name, slug')
    .eq('level', 'brand');

  const brandGroups = {};
  brands.forEach(b => {
    if (!brandGroups[b.slug]) brandGroups[b.slug] = [];
    brandGroups[b.slug].push(b.id);
  });

  for (const [slug, ids] of Object.entries(brandGroups)) {
    if (ids.length > 1) {
      console.log(`🔗 Birleştiriliyor: ${slug} (${ids.length} adet)`);
      const mainId = ids[0];
      const duplicateIds = ids.slice(1);

      // Çocukları ana ID'ye taşı
      const { error: moveErr } = await supabase
        .from('car_taxonomy')
        .update({ parent_id: mainId })
        .in('parent_id', duplicateIds);

      if (moveErr) console.error(`  ! Taşıma hatası (${slug}):`, moveErr.message);

      // İlanları (cars tablosu) ana ID'ye taşı (Eğer ilanlar marka üzerinden bağlanıyorsa)
      // Bu projede ilanlar package_id üzerinden bağlanıyor, marka id'si sadece hiyerarşi için.

      // Mükerrer markaları sil
      const { error: delErr } = await supabase
        .from('car_taxonomy')
        .delete()
        .in('id', duplicateIds);
      
      if (delErr) console.error(`  ! Silme hatası (${slug}):`, delErr.message);
      else console.log(`  ✅ ${slug} tertemiz yapıldı.`);
    }
  }

  // 3. HATALI MARKA KAYITLARINI MODELE TAŞIMA (Örn: "Audi A4" -> Brand: Audi, Model: A4)
  console.log("\n3. Hatalı marka/model çakışmaları çözülüyor...");
  const { data: allBrands } = await supabase.from('car_taxonomy').select('*').eq('level', 'brand');
  
  for (const brand of allBrands) {
    // "Audi A4", "Bmw 3 Serisi" gibi içinde boşluk olan ve bir markayla başlayan kayıtları ara
    const parts = brand.name.split(' ');
    if (parts.length > 1) {
      const potentialBrandName = parts[0];
      const realBrand = allBrands.find(b => b.name.toLowerCase() === potentialBrandName.toLowerCase() && b.id !== brand.id);
      
      if (realBrand) {
        const modelName = parts.slice(1).join(' ');
        console.log(`🚀 Taşıma: "${brand.name}" -> ${realBrand.name} markasının altına "${modelName}" modeli olarak taşınıyor.`);
        
        // Bu hatalı markanın çocukları varsa önce onları bu modele bağla? (Karmaşıklaşabilir, ama güvenli olan bu)
        // Şimdilik sadece bu kaydı model yapıp parent_id set ediyoruz
        const { error: fixErr } = await supabase
          .from('car_taxonomy')
          .update({ 
            level: 'model', 
            parent_id: realBrand.id,
            name: modelName
          })
          .eq('id', brand.id);
          
        if (fixErr) console.error(`  ! Hiyerarşi fix hatası:`, fixErr.message);
      }
    }
  }

  console.log("\n✨ TOTAL REPAIR COMPLETED!");
}

totalRepair();
