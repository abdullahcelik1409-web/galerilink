const { createClient } = require('@supabase/supabase-js');
const { TR_MARKET_DATA } = require('./data/tr_market_data');
require('dotenv').config({ path: '.env.local' });

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

async function upsertNode(name, level, parentId) {
  const { data, error } = await supabase.from('car_taxonomy').upsert({
    name,
    level,
    parent_id: parentId,
    slug: toSlug(name + "-" + level + (parentId ? "-" + parentId.substring(0,4) : ""))
  }, { onConflict: 'parent_id, name' }).select().single();
  
  if (error) {
    console.error(`  ! Error upserting ${name} (${level}):`, error.message);
    return null;
  }
  return data;
}

async function masterFix() {
  console.log("💣 SIFIRLAMA VE YENİDEN İNŞA BAŞLIYOR...");

  // 1. CARS tablosundaki package_id referanslarını kopar (FK hatasını önlemek için)
  console.log("\n1. Araç ilanlarındaki eski taxonomy bağlantıları kesiliyor...");
  const { error: carsErr } = await supabase.from('cars').update({ package_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
  if (carsErr) console.error("  ! Cars Update Error:", carsErr.message);

  console.log("\n2. Eski sorunlu hiyerarşi (Marka altı her şey) başarıyla temizlendi.");

  // 3. MÜKERRER MARKALARI BUL VE SİL
  console.log("\n3. Mükerrer markalar (Duplicate Brands) analiz edilip tekilleştiriliyor...");
  const { data: brands } = await supabase.from('car_taxonomy').select('id, name, slug').eq('level', 'marka');
  
  const groups = {};
  brands.forEach(b => {
    const key = b.name.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  const validBrandIds = {}; // Marka adına göre ana ID
  
  for (const [name, items] of Object.entries(groups)) {
    validBrandIds[name] = items[0].id; // İlkini ana kayıt kabul et
    
    if (items.length > 1) {
      console.log(`  - [${name}] için ${items.length} kayıt bulundu. Tekilleştiriliyor...`);
      const idsToDelete = items.slice(1).map(i => i.id);
      await supabase.from('car_taxonomy').delete().in('id', idsToDelete);
    }
  }

  // 4. KUSURSUZ YENİ HİYERARŞİYİ İNŞA ET
  console.log("\n4. İnanılmaz dataylı yeni hiyerarşi sıfırdan inşa ediliyor...");

  for (const [brandName, modelsObj] of Object.entries(TR_MARKET_DATA)) {
    const brandKey = brandName.toLowerCase();
    
    // Eğer marka DB'de yoksa yarat (büyük ihtimalle var ama önlem)
    let brandId = validBrandIds[brandKey];
    if (!brandId) {
      console.log(`  + Yeni Marka: ${brandName}`);
      const newB = await upsertNode(brandName, 'marka', null);
      if(newB) brandId = newB.id;
    }
    if (!brandId) continue;

    console.log(`\n📦 Şekillendiriliyor: [${brandName}]`);

    // MODEL DÖNGÜSÜ (Örn: 5 Serisi, A3)
    for (const [modelName, seriesObj] of Object.entries(modelsObj)) {
      const modelNode = await upsertNode(modelName, 'model', brandId);
      if (!modelNode) continue;

      // SERİ DÖNGÜSÜ (Örn: 520i, 35 TFSI, 1.5 dCi - arabadan arabaya değişir)
      for (const [seriesName, packagesArr] of Object.entries(seriesObj)) {
        const seriNode = await upsertNode(seriesName, 'seri', modelNode.id);
        if (!seriNode) continue;

        const motorCache = {};
        const sanzimanCache = {};
        const kasaCache = {};

        // MOTOR, ŞANZIMAN, KASA, PAKET DÖNGÜSÜ
        for (const spec of packagesArr) {
          // MOTOR
          let motorId = motorCache[spec.motor];
          if (!motorId) {
            const motorNode = await upsertNode(spec.motor, 'motor', seriNode.id);
            if(motorNode) { motorId = motorNode.id; motorCache[spec.motor] = motorId; }
          }
          if (!motorId) continue;

          // ŞANZIMAN
          const sCacheKey = `${motorId}-${spec.sanziman}`;
          let sanzimanId = sanzimanCache[sCacheKey];
          if (!sanzimanId) {
            const sanzimanNode = await upsertNode(spec.sanziman, 'sanziman', motorId);
            if(sanzimanNode) { sanzimanId = sanzimanNode.id; sanzimanCache[sCacheKey] = sanzimanId; }
          }
          if (!sanzimanId) continue;

          // KASA
          const kCacheKey = `${sanzimanId}-${spec.kasa}`;
          let kasaId = kasaCache[kCacheKey];
          if (!kasaId) {
             const kasaNode = await upsertNode(spec.kasa, 'kasa', sanzimanId);
             if(kasaNode) { kasaId = kasaNode.id; kasaCache[kCacheKey] = kasaId; }
          }
          if (!kasaId) continue;

          // PAKET
          await upsertNode(spec.paket, 'paket', kasaId);
        }
      }
    }
  }

  console.log("\n✅ GÖREV TAMAMLANDI! Hiyerarşi Kusursuz Hale Getirildi.");
}

masterFix();
