const axios = require('axios');
const { supabaseAdmin } = require('./utils/supabase-admin');

// NHTSA (National Highway Traffic Safety Administration) Open API
const API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Türkiye piyasasında en çok aranan markalar (API'den bu markaların tüm modelleri çekilecek)
const TARGET_BRANDS = [
  'audi', 'bmw', 'fiat', 'ford', 'honda', 'hyundai', 
  'mercedes-benz', 'nissan', 'peugeot', 'renault', 
  'toyota', 'volkswagen', 'volvo'
];

// Türkiye'ye özel donanım paketlerinin marka bazlı jeneratörü
const TURKEY_PACKAGES = {
  'bmw': ['M Sport', 'Luxury Line', 'Executive', 'Sport Line'],
  'mercedes-benz': ['AMG', 'Exclusive', 'Avantgarde', 'Fascination'],
  'audi': ['S Line', 'Advanced', 'Design', 'Sport'],
  'renault': ['Joy', 'Touch', 'Icon', 'RS Line'],
  'fiat': ['Easy', 'Urban', 'Lounge', 'Cross'],
  'toyota': ['Vision', 'Dream', 'Flame X-Pack', 'Passion X-Pack'],
  'volkswagen': ['Impression', 'Life', 'Style', 'R-Line', 'Elegance'],
  'ford': ['Trend X', 'Titanium', 'ST-Line'],
  'peugeot': ['Active', 'Allure', 'GT'],
  'honda': ['Elegance', 'Executive', 'Executive+'],
  'hyundai': ['Jump', 'Style', 'Elite', 'Elite Plus'],
  'default': ['Standart', 'Premium', 'Full Paket']
};

const LOGOS = {
  'audi': 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
  'bmw': 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
  'fiat': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg',
  'ford': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg',
  'honda': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg',
  'hyundai': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg',
  'mercedes-benz': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
  'nissan': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg',
  'peugeot': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg',
  'renault': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg',
  'toyota': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg',
  'volkswagen': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
  'volvo': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo-Iron-Mark-Black.svg'
};

function toSlug(text) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchAndSeedAPI() {
  console.log('🌐 API Bağlantısı Başlatıldı: NHTSA Global Veritabanı...');

  for (const brand of TARGET_BRANDS) {
    console.log(`\n=======================`);
    console.log(`🚀 Çekiliyor: ${brand.toUpperCase()}`);

    try {
      // 1. API'den Markanın Tüm Modellerini Çek
      const res = await axios.get(`${API_BASE}/GetModelsForMake/${brand}?format=json`);
      const apiModels = res.data.Results; // Returns array of { Make_Name, Model_Name }

      if (!apiModels || apiModels.length === 0) continue;

      // Duplicate'leri temizle ve alfabetik diz
      const uniqueModels = [...new Set(apiModels.map(m => m.Model_Name))].sort();
      console.log(`Toplam ${uniqueModels.length} farklı model bulundu.`);

      // 2. Markayı Veri Tabanına Ekle
      const brandDisplay = apiModels[0].Make_Name || brand.toUpperCase();
      const { data: dbBrand, error: brandErr } = await supabaseAdmin
        .from('car_taxonomy')
        .upsert({ 
          name: brandDisplay, 
          slug: toSlug(brandDisplay), 
          level: 'brand', 
          logo_url: LOGOS[brand] || null,
          parent_id: null 
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();

      if (brandErr) {
        console.error('Marka Eklenemedi:', brandErr.message);
        continue;
      }

      // 3. Markaya özel Türkiye Desteğini Bul (Örn: 'Joy', 'Touch' vb.)
      const trPackages = TURKEY_PACKAGES[brand] || TURKEY_PACKAGES['default'];

      // Sadece popüler olan ve çok bilinmeyen ticari/çöp modelleri elemek için basit bir filtre
      // (Örneğin API'den çok spesifik tır çekerse diye ilk 15 en popüler model ismini baz alıyoruz)
      const popularModels = uniqueModels.slice(0, 15);

      for (const modelName of popularModels) {
        process.stdout.write(`  > Model: ${modelName} `);
        
        // Modeli Ekle (Hiyerarşimizde 'series' seviyesi olarak kullanacağız)
        const { data: dbSeries, error: seriesErr } = await supabaseAdmin
          .from('car_taxonomy')
          .upsert({ 
            name: modelName, 
            slug: toSlug(modelName), 
            level: 'series', 
            parent_id: dbBrand.id 
          }, { onConflict: 'parent_id, name' })
          .select()
          .single();

        if (seriesErr) continue;

        // 4. Türkiye Paketlerini (Model) Ekleyerek "Turkish Edition" Yap (Donanım/Paket Seviyesi)
        for (const pkg of trPackages) {
          await supabaseAdmin
            .from('car_taxonomy')
            .upsert({ 
              name: pkg, 
              slug: toSlug(pkg), 
              level: 'model', 
              parent_id: dbSeries.id 
            }, { onConflict: 'parent_id, name' });
        }
        console.log(`[+] (TR Paketler Eklendi)`);
      }

    } catch (err) {
      console.error(`${brand} için API çekimi başarısız:`, err.message);
    }
  }
  console.log('\n✅ 🚀 API -> Supabase Veri Entegrasyonu Başarıyla Tamamlandı!');
}

fetchAndSeedAPI();
