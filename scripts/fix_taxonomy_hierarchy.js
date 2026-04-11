const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bilinen marka isimleri (Öncelikli eşleşme için uzun isimler en başa)
const KNOWN_BRANDS = [
  "Alfa Romeo", "Aston Martin", "Mercedes-Benz", "Land Rover", "Range Rover",
  "Audi", "Bentley", "Bmw", "BMW", "Byd", "BYD", "Cadillac", "Chery", "Chevrolet", 
  "Chrysler", "Citroen", "Cupra", "Dacia", "Ford", "Honda", "Hyundai", "Toyota", 
  "Volkswagen", "Fiat", "Nissan", "Peugeot", "Renault", "Daewoo", "Daihatsu", 
  "Dodge", "Ds", "DS", "Ferrari", "Jaguar", "Kia", "Lamborghini", "Lancia", 
  "Lexus", "Maserati", "Mazda", "Mercedes", "MG", "Mini", "Mitsubishi", 
  "Opel", "Porsche", "Seat", "Skoda", "Smart", "Subaru", "Suzuki", "Tesla", 
  "Tofaş", "Volvo", "Iveco", "Isuzu", "Karsan"
];

function toSlug(text) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fixTaxonomy() {
  console.log("Hiyerarşi düzeltme başlatılıyor...");

  // 1. Tüm Marka kayıtlarını çek
  const { data: allBrands, error: fetchError } = await supabase
    .from('car_taxonomy')
    .select('*')
    .eq('level', 'brand');

  if (fetchError) {
    console.error("Veri çekme hatası:", fetchError.message);
    return;
  }

  console.log(`${allBrands.length} adet marka kaydı inceleniyor...`);

  for (const item of allBrands) {
    let brandName = "";
    let remainingName = "";

    // İsmi bilinen markalarla karşılaştır
    const matchedBrand = KNOWN_BRANDS.find(b => item.name.toLowerCase().startsWith(b.toLowerCase()));

    if (matchedBrand) {
      brandName = matchedBrand;
      remainingName = item.name.substring(matchedBrand.length).trim();
    } else {
      // Bilinen markalarda yoksa ilk kelimeyi marka say
      const parts = item.name.split(' ');
      brandName = parts[0];
      remainingName = parts.slice(1).join(' ').trim();
    }

    // Eğer isim zaten sadece markadan oluşuyorsa (boşluk yoksa/kalan isim yoksa) işlem yapma
    if (!remainingName) {
      // Sadece ismini normalize et (örn: "Audi" diye kalsın)
      continue; 
    }

    console.log(`Dönüştürülüyor: "${item.name}" -> [Marka: ${brandName}] [Kalan: ${remainingName}]`);

    try {
      // 2. Gerçek Markayı Bul veya Yarat
      const { data: dbBrand, error: brandError } = await supabase
        .from('car_taxonomy')
        .upsert({
          name: brandName,
          slug: toSlug(brandName),
          level: 'brand',
          parent_id: null
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();

      if (brandError) {
        console.error(`Marka hatası (${brandName}):`, brandError.message);
        continue;
      }

      // 3. Kalan ismi parçalara ayır ve Seri/Model olarak ekle
      // Kalan ismi de boşluğa göre ayırıp ilkini seri yapalım
      const remainingParts = remainingName.split(' ');
      const seriesName = remainingParts[0];
      const modelName = remainingParts.slice(1).join(' ').trim();

      // Seri Ekle
      const { data: dbSeries, error: seriesError } = await supabase
        .from('car_taxonomy')
        .upsert({
          name: seriesName,
          slug: toSlug(seriesName),
          level: 'series',
          parent_id: dbBrand.id
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();

      if (seriesError) {
        console.error(`Seri hatası (${seriesName}):`, seriesError.message);
        continue;
      }

      // Eğer hala isim kaldıysa (Model/Paket), onu da ekle
      if (modelName) {
        await supabase
          .from('car_taxonomy')
          .upsert({
            name: modelName,
            slug: toSlug(modelName),
            level: 'package', // Database'de 'model' yok, 'package' var
            parent_id: dbSeries.id
          }, { onConflict: 'parent_id, name' });
      }

      // 4. Eski (Bozuk) kaydı temizle
      // Eğer eski kayıt şu anki ana marka değilse sil (ID'leri farklıysa)
      if (item.id !== dbBrand.id) {
         await supabase.from('car_taxonomy').delete().eq('id', item.id);
      }

    } catch (e) {
      console.error(`İşlem hatası (${item.name}):`, e.message);
    }
  }

  console.log("\nDüzeltme tamamlandı.");
}

fixTaxonomy();
