const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Türkiye'de En Popüler ve Bilinen 100 Marka (Alfabetik)
const TURKEY_TOP_100_MAKES = [
  "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "Bmw", "Bugatti", "Buick", "Byd", "Cadillac", "Chery", 
  "Chevrolet", "Chrysler", "Citroen", "Cupra", "Dacia", "Daewoo", "Daihatsu", "Dodge", "Ds", "Ferrari", 
  "Fiat", "Ford", "Gmc", "Honda", "Hummer", "Hyundai", "Infiniti", "Isuzu", "Iveco", "Jaguar", 
  "Jeep", "Kia", "Lamborghini", "Lancia", "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda", 
  "McLaren", "Mercedes-Benz", "Mg", "Mini", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Porsche", "Proton", 
  "Renault", "Rolls-Royce", "Rover", "Saab", "Seat", "Skoda", "Smart", "Ssangyong", "Subaru", "Suzuki", 
  "Tata", "Tesla", "Tofaş", "Toyota", "Volkswagen", "Volvo", "Geely", "GWM", "Haval", "Hongqi", 
  "Jaecoo", "Jetour", "Karsan", "Leapmotor", "Omoda", "Skywell", "Togg", "Voyah", "Seres", "Maxus"
  // Liste 100'e tamamlanacak şekilde popülerlik sırasına göre genişletilebilir
].map(m => m.trim());

function toSlug(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Model ismini Türkiye pazarına göre sadeleştirir
function cleanModelName(modelName, brandName) {
  let name = modelName;
  
  // Marka ismini model isminden çıkar (Örn: "Audi A4" -> "A4")
  const brandRegex = new RegExp(`^${brandName}\\s+`, 'i');
  name = name.replace(brandRegex, '');

  // Gereksiz global ekleri temizle
  name = name.replace(/\s+(Sedan|Hatchback|Coupe|Sport|Limited|Edition|Hybrid|PHEV|EV|4WD|AWD)$/i, '');
  
  // Sayısal modelleri koru (Örn: 320, 520), gereksiz trim yap
  return name.trim();
}

async function syncTurkeyCars() {
  console.log("🚀 Türkiye Odaklı Akıllı Veri Senkronizasyonu Başlatılıyor...");

  // 1. Mevcut Markaları Veritabanından Al (Eşleşme için)
  const { data: dbBrands, error: brandError } = await supabase
    .from('car_taxonomy')
    .select('id, name, slug')
    .eq('level', 'brand');

  if (brandError) {
    console.error("Marka çekme hatası:", brandError.message);
    return;
  }

  const brandMap = {};
  dbBrands.forEach(b => brandMap[b.slug] = b.id);

  console.log(`✅ Veritabanında ${dbBrands.length} mevcut marka bulundu.`);

  for (const makeName of TURKEY_TOP_100_MAKES) {
    const brandSlug = toSlug(makeName);
    let brandId = brandMap[brandSlug];

    // Eğer marka yoksa, önce markayı ekle
    if (!brandId) {
      console.log(`🆕 Yeni Marka Ekleniyor: ${makeName}`);
      
      // Önce veritabanına bir kez daha bak (yarış durumu için)
      const { data: checkBrand } = await supabase
        .from('car_taxonomy')
        .select('id')
        .eq('slug', brandSlug)
        .eq('level', 'brand')
        .maybeSingle();

      if (checkBrand) {
        brandId = checkBrand.id;
      } else {
        const { data: newBrand, error: insertError } = await supabase
          .from('car_taxonomy')
          .insert({ name: makeName, slug: brandSlug, level: 'brand' })
          .select()
          .single();
        
        if (insertError) {
          console.warn(`⚠️ ${makeName} eklenemedi:`, insertError.message);
          continue;
        }
        brandId = newBrand.id;
      }
    }

    console.log(`\n📦 [${makeName}] modelleri çekiliyor...`);

    try {
      // NHTSA API'den modelleri çek
      const res = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(makeName)}?format=json`);
      const apiModels = res.data.Results || [];

      if (apiModels.length === 0) {
        console.log(`  ! Modeller bulunamadı, atlanıyor.`);
        continue;
      }

      const uniqueModels = new Set();
      const modelsToInsert = [];

      for (const apiModel of apiModels) {
        const rawName = apiModel.Model_Name;
        const cleanedName = cleanModelName(rawName, makeName);
        const modelSlug = toSlug(cleanedName);

        // Türkiye'de hiç olmayan Amerikan tırlarını veya saçma modelleri filtrele (Basit kelime bazlı filtre)
        if (rawName.match(/(Truck|Bus|Incompleted|Heavy Duty|Commercial|Cab|Chassis)/i)) continue;
        if (cleanedName.length < 1) continue;

        if (!uniqueModels.has(modelSlug)) {
          uniqueModels.add(modelSlug);
          modelsToInsert.push({
            name: cleanedName,
            slug: modelSlug,
            level: 'series',
            parent_id: brandId
          });
        }
      }

      console.log(`  > ${modelsToInsert.length} adet geçerli seri (model) bulundu. Kaydediliyor...`);

      // Toplu Upsert
      const { error: upsertError } = await supabase
        .from('car_taxonomy')
        .upsert(modelsToInsert, { onConflict: 'parent_id, name' });

      if (upsertError) {
        console.error(`  ! Kayıt hatası (${makeName}):`, upsertError.message);
      } else {
        console.log(`  ✅ ${makeName} serileri başarıyla güncellendi.`);
      }

    } catch (apiErr) {
      console.error(`  ! API hatası (${makeName}):`, apiErr.message);
    }
  }

  console.log("\n✨ Tüm senkronizasyon işlemi tamamlandı!");
}

syncTurkeyCars();
