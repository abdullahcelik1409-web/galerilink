const { supabaseAdmin } = require('./utils/supabase-admin');

// Türkiye'nin en popüler araç marka, seri ve modelleri
const carData = [
  {
    brand: "Audi",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
    series: [
      { name: "A3", models: ["A3 Sedan", "A3 Sportback"] },
      { name: "A4", models: ["A4 Sedan", "A4 Avant"] },
      { name: "A6", models: ["A6 Sedan", "A6 Avant"] },
      { name: "Q3", models: ["Q3", "Q3 Sportback"] }
    ]
  },
  {
    brand: "BMW",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg",
    series: [
      { name: "1 Serisi", models: ["116d", "118i", "120i"] },
      { name: "3 Serisi", models: ["320i", "320d", "330i"] },
      { name: "5 Serisi", models: ["520i", "520d", "530i"] },
      { name: "X5", models: ["X5 xDrive30d", "X5 xDrive40i"] }
    ]
  },
  {
    brand: "Fiat",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg",
    series: [
      { name: "Egea", models: ["Egea Sedan", "Egea Cross", "Egea Hatchback"] },
      { name: "500", models: ["500", "500X", "500L"] }
    ]
  },
  {
    brand: "Ford",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg",
    series: [
      { name: "Focus", models: ["Focus Sedan", "Focus Hatchback"] },
      { name: "Fiesta", models: ["Fiesta", "Fiesta ST"] },
      { name: "Kuga", models: ["Kuga Titanium", "Kuga ST-Line"] }
    ]
  },
  {
    brand: "Mercedes-Benz",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
    series: [
      { name: "A-Serisi", models: ["A 180", "A 200", "A 200 d"] },
      { name: "C-Serisi", models: ["C 200", "C 200 d", "C 300"] },
      { name: "E-Serisi", models: ["E 180", "E 200 d", "E 300"] }
    ]
  },
  {
    brand: "Renault",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg",
    series: [
      { name: "Clio", models: ["Clio Joy", "Clio Touch", "Clio Icon"] },
      { name: "Megane", models: ["Megane Sedan", "Megane Hatchback"] },
      { name: "Taliant", models: ["Taliant Joy", "Taliant Touch"] }
    ]
  },
  {
    brand: "Toyota",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
    series: [
      { name: "Corolla", models: ["Corolla Vision", "Corolla Dream", "Corolla Flame"] },
      { name: "Yaris", models: ["Yaris Dream", "Yaris Flame"] },
      { name: "C-HR", models: ["C-HR Hybrid"] }
    ]
  },
  {
    brand: "Volkswagen",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
    series: [
      { name: "Golf", models: ["Golf Impression", "Golf R-Line", "Golf Style"] },
      { name: "Passat", models: ["Passat Impression", "Passat Business", "Passat Elegance"] },
      { name: "Polo", models: ["Polo Life", "Polo Style"] },
      { name: "Tiguan", models: ["Tiguan Life", "Tiguan Elegance"] }
    ]
  }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function toSlug(text) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedData() {
  console.log('Veri aktarımı başlıyor...');

  // Sort brands alphabetically
  const sortedBrands = carData.sort((a, b) => a.brand.localeCompare(b.brand));

  for (const brandObj of sortedBrands) {
    console.log(`\n=======================`);
    console.log(`İşleniyor: ${brandObj.brand}`);
    
    // Insert Brand
    const { data: dbBrand, error: brandErr } = await supabaseAdmin
      .from('car_taxonomy')
      .upsert({ 
        name: brandObj.brand, 
        slug: toSlug(brandObj.brand), 
        level: 'brand', 
        logo_url: brandObj.logoUrl,
        parent_id: null 
      }, { onConflict: 'parent_id, name' })
      .select()
      .single();

    if (brandErr) {
      console.error(`Marka eklenirken hata (${brandObj.brand}):`, brandErr.message);
      continue;
    }

    // Sort series alphabetically
    const sortedSeries = brandObj.series.sort((a, b) => a.name.localeCompare(b.name));

    for (const seriesObj of sortedSeries) {
      console.log(`  > Seri: ${seriesObj.name}`);
      
      const { data: dbSeries, error: seriesErr } = await supabaseAdmin
        .from('car_taxonomy')
        .upsert({ 
          name: seriesObj.name, 
          slug: toSlug(seriesObj.name), 
          level: 'series', 
          parent_id: dbBrand.id 
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();
        
      if (seriesErr) continue;

      // Sort models alphabetically
      const sortedModels = seriesObj.models.sort((a, b) => a.localeCompare(b));

      for (const modelName of sortedModels) {
        console.log(`    - Model: ${modelName}`);
        
        await supabaseAdmin
          .from('car_taxonomy')
          .upsert({ 
            name: modelName, 
            slug: toSlug(modelName), 
            level: 'model', 
            parent_id: dbSeries.id 
          }, { onConflict: 'parent_id, name' });
      }
    }
    await sleep(500); // Be kind to the DB rate limits
  }

  console.log('\n✅ Tüm hiyerarşik araç verileri (alfabetik olarak) başarıyla eklendi!');
}

seedData();
