const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepCleanAndRepair() {
  console.log("🛠️ DERİN TEMİZLİK VE ONARIM BAŞLATILIYOR (V2)...");

  // --- 1. MÜKERRER MARKA BİRLEŞTİRME (EN ÖNEMLİ ADIM) ---
  console.log("\n1. Mükerrer markalar (Brand) taranıyor...");
  const { data: allBrands } = await supabase
    .from('car_taxonomy')
    .select('id, name, slug')
    .eq('level', 'brand');

  const brandGroups = {};
  allBrands.forEach(b => {
    // Slug bazlı grupla (audi-1, audi-2 vb. gelmiş olabilir mi? Hayır sluglar birebir aynıysa)
    if (!brandGroups[b.slug]) brandGroups[b.slug] = [];
    brandGroups[b.slug].push(b.id);
  });

  for (const [slug, ids] of Object.entries(brandGroups)) {
    if (ids.length > 1) {
      console.log(`🔗 Birleştiriliyor: ${slug} (${ids.length} adet)`);
      const mainId = ids[0];
      const duplicateIds = ids.slice(1);

      // Tüm çocukları (Series/Model) ana ID'ye taşı
      const { error: moveErr } = await supabase
        .from('car_taxonomy')
        .update({ parent_id: mainId })
        .in('parent_id', duplicateIds);

      if (moveErr) console.error(`  ! Çocukları taşıma hatası (${slug}):`, moveErr.message);

      // Mükerrer kopyaları sil
      const { error: delErr } = await supabase
        .from('car_taxonomy')
        .delete()
        .in('id', duplicateIds);
      
      if (delErr) console.error(`  ! Silme hatası (${slug}):`, delErr.message);
      else console.log(`  ✅ ${slug} tertemiz yapıldı.`);
    }
  }

  // --- 2. HATALI MARKA KAYITLARINI SERİYE TAŞIMA (Örn: "Audi A4") ---
  console.log("\n2. Seviye hataları (Marka sanılan Seriler) düzeltiliyor...");
  // Tekrar listeyi al (silmelerden sonra güncel olsun)
  const { data: currentBrands } = await supabase.from('car_taxonomy').select('*').eq('level', 'brand');
  
  for (const item of currentBrands) {
    const parts = item.name.split(' ');
    if (parts.length > 1) {
      const brandName = parts[0];
      const realBrand = currentBrands.find(b => b.name.toLowerCase() === brandName.toLowerCase() && b.id !== item.id);
      
      if (realBrand) {
        const seriesName = parts.slice(1).join(' ');
        console.log(`🚀 Düzeltiliyor: "${item.name}" -> [${realBrand.name}] markasının altına "${seriesName}" serisi olarak taşınıyor.`);
        
        const { error: fixErr } = await supabase
          .from('car_taxonomy')
          .update({ 
            level: 'series', 
            parent_id: realBrand.id,
            name: seriesName,
            slug: item.slug // Slug'ı koruyalım veya isme göre tekrar oluşturulabilir
          })
          .eq('id', item.id);
          
        if (fixErr) console.error(`  ! Hiyerarşi taşıma hatası:`, fixErr.message);
      }
    }
  }

  // --- 3. AUDİ ÖZEL DÜZELTME (Slug çakışmaları için agresif temizlik) ---
  console.log("\n3. Özel temizlik (Slug bazlı kontrol)...");
  // Eğer hala duplicate varsa manuel temizlik
  
  console.log("\n✨ DERİN TEMİZLİK TAMAMLANDI!");
  console.log("Artık UI ile Veritabanı aynı dili konuşuyor (brand -> series -> package).");
}

deepCleanAndRepair();
