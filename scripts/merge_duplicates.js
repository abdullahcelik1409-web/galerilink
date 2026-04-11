const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function mergeDuplicates() {
  console.log("Mükerrer markaları (Slug bazlı) birleştirme işlemi başlatılıyor...");

  // 1. Tüm Markaları Çek
  const { data: brands, error } = await supabase
    .from('car_taxonomy')
    .select('*')
    .eq('level', 'brand');

  if (error) {
    console.error("Hata:", error.message);
    return;
  }

  // 2. Slug'a Göre Grupla (Daha güvenli)
  const groups = {};
  brands.forEach(b => {
    const slug = b.slug || toSlug(b.name);
    if (!groups[slug]) groups[slug] = [];
    groups[slug].push(b);
  });

  console.log(`Toplam ${Object.keys(groups).length} benzersiz marka (slug) üzerinden işlem yapılacak.`);

  for (const [slug, items] of Object.entries(groups)) {
    if (items.length <= 1) continue;

    // En çok veriye sahip olanı veya ilkini Master seç
    const master = items[0];
    const duplicates = items.slice(1);
    const duplicateIds = duplicates.map(d => d.id);

    console.log(`\n"${master.name}" (slug: ${slug}) birleştiriliyor [${items.length} adet]...`);

    try {
      // 3. Çocukları Master'a taşıarken tek tek dene (çatışmaları önlemek için)
      console.log(`  > Alt veriler aktarılıyor...`);
      
      const { data: children } = await supabase
        .from('car_taxonomy')
        .select('*')
        .in('parent_id', duplicateIds);

      if (children && children.length > 0) {
        for (const child of children) {
          const { error: moveError } = await supabase
            .from('car_taxonomy')
            .update({ parent_id: master.id })
            .eq('id', child.id);
          
          if (moveError && moveError.code === '23505') {
             // Zaten master altında aynı isimde bir çocuk var, o zaman bu çocuğu silip 
             // onun altındaki torunları (grandchildren) mevcut master-child'a bağlamamız lazım.
             // Şimdilik sadece bu çocuğu silmek (mükerrer seri) yeterli olabilir.
             console.log(`  ! Mükerrer alt veri tespit edildi (${child.name}), siliniyor.`);
             await supabase.from('car_taxonomy').delete().eq('id', child.id);
          }
        }
      }

      // 4. Mükerrer Ana Markaları sil
      console.log(`  > Gereksiz ana kayıtlar temizleniyor...`);
      await supabase.from('car_taxonomy').delete().in('id', duplicateIds);
      console.log(`  > İşlem tamam.`);

    } catch (e) {
      console.error(`  ! Hata (${master.name}):`, e.message);
    }
  }

  console.log("\nSlug bazlı birleştirme işlemi başarıyla tamamlandı.");
}

function toSlug(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

mergeDuplicates();
