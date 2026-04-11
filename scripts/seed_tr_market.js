const { supabaseAdmin } = require('./utils/supabase-admin');

const TR_CAR_DATA = [
  {
    brand: "Audi",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
    series: [
      { name: "A3", models: ["A3 Sedan", "A3 Sportback"], packages: ["Advanced", "S Line", "Design"] },
      { name: "A4", models: ["A4 Sedan", "A4 Avant"], packages: ["Advanced", "S Line", "Design", "PI"] },
      { name: "A6", models: ["A6 Sedan", "A6 Avant"], packages: ["Design", "S Line", "Quattro"] },
      { name: "Q3", models: ["Q3", "Q3 Sportback"], packages: ["Advanced", "S Line"] }
    ]
  },
  {
    brand: "BMW",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg",
    series: [
      { name: "1 Serisi", models: ["116d", "118i", "120i"], packages: ["Joy", "M Sport", "Sport Line", "Urban Line"] },
      { name: "3 Serisi", models: ["320i", "320d", "330i"], packages: ["M Sport", "Luxury Line", "Executive", "Sport Line", "Techno"] },
      { name: "5 Serisi", models: ["520i", "520d", "530i"], packages: ["M Sport", "Luxury Line", "Executive Plus", "Special Edition"] },
      { name: "X5", models: ["X5 xDrive30d", "X5 xDrive40i"], packages: ["M Sport", "XLine"] }
    ]
  },
  {
    brand: "Fiat",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg",
    series: [
      { name: "Egea", models: ["1.3 Multijet", "1.4 Fire", "1.6 Multijet"], packages: ["Easy", "Urban", "Lounge", "Lounge Plus", "Cross", "Street"] },
      { name: "500", models: ["500", "500X", "500L"], packages: ["Cult", "Dolcevita", "Pop", "Rock"] },
      { name: "Fiorino", models: ["1.3 Multijet", "1.4 Eco"], packages: ["Pop", "Safeline", "Premio"] }
    ]
  },
  {
    brand: "Ford",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg",
    series: [
      { name: "Focus", models: ["Focus 1.5 TDCi", "Focus 1.0 EcoBoost"], packages: ["Trend X", "Titanium", "ST-Line", "Ghia"] },
      { name: "Fiesta", models: ["Fiesta 1.4 TDCi", "Fiesta 1.0 EcoBoost"], packages: ["Trend", "Titanium", "ST"] },
      { name: "Kuga", models: ["Kuga 1.5 EcoBlue", "Kuga 1.5 EcoBoost"], packages: ["Titanium", "ST-Line", "Vignale"] },
      { name: "Courier", models: ["1.5 TDCi"], packages: ["Trend", "Titanium", "Titanium Plus", "Journey"] }
    ]
  },
  {
    brand: "Honda",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg",
    series: [
      { name: "Civic", models: ["1.6 i-VTEC", "1.5 VTEC", "1.6 i-DTEC"], packages: ["Elegance", "Executive", "Executive+", "Eco Elegance", "RS", "Dream"] },
      { name: "City", models: ["1.5 i-VTEC"], packages: ["Elegance", "Executive"] },
      { name: "CR-V", models: ["1.5 VTEC", "1.6 i-DTEC", "2.0 i-MMD"], packages: ["Elegance", "Executive", "Executive+"] }
    ]
  },
  {
    brand: "Hyundai",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg",
    series: [
      { name: "i20", models: ["1.0 T-GDI", "1.4 MPI", "1.2 MPI"], packages: ["Jump", "Style", "Elite", "N Line"] },
      { name: "Tucson", models: ["1.6 T-GDI", "1.6 CRDi"], packages: ["Comfort", "Prime", "Elite", "Elite Plus", "N Line"] },
      { name: "Bayon", models: ["1.4 MPI", "1.0 T-GDI"], packages: ["Jump", "Style", "Elite"] },
      { name: "Elantra", models: ["1.6 MPI"], packages: ["Style", "Smart", "Elite"] }
    ]
  },
  {
    brand: "Mercedes-Benz",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
    series: [
      { name: "A-Serisi", models: ["A 180", "A 200", "A 200 d"], packages: ["AMG", "Style", "Progressive"] },
      { name: "C-Serisi", models: ["C 200", "C 200 d", "C 300"], packages: ["AMG", "Avantgarde", "Fascination", "Exclusive"] },
      { name: "E-Serisi", models: ["E 180", "E 200 d", "E 300"], packages: ["AMG", "Exclusive", "Avantgarde", "Edition 1"] },
      { name: "CLA", models: ["CLA 200", "CLA 200 d"], packages: ["AMG", "Progressive"] }
    ]
  },
  {
    brand: "Nissan",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg",
    series: [
      { name: "Qashqai", models: ["1.2 DIG-T", "1.3 DIG-T", "1.5 dCi", "1.6 dCi"], packages: ["Visia", "Tekna", "Sky Pack", "Design Pack", "Platinum Premium"] },
      { name: "Micra", models: ["1.0 IG-T", "1.2", "1.5 dCi"], packages: ["Visia", "Tekna", "Platinum"] },
      { name: "Juke", models: ["1.0 DIG-T", "1.5 dCi"], packages: ["Tekna", "Platinum", "Platinum Premium"] }
    ]
  },
  {
    brand: "Peugeot",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg",
    series: [
      { name: "208", models: ["1.2 PureTech", "1.5 BlueHDi"], packages: ["Active", "Allure", "GT", "Prime"] },
      { name: "3008", models: ["1.2 PureTech", "1.5 BlueHDi", "1.6 PureTech"], packages: ["Active", "Allure", "GT", "GT-Line"] },
      { name: "2008", models: ["1.2 PureTech", "1.5 BlueHDi"], packages: ["Active", "Allure", "GT"] },
      { name: "308", models: ["1.2 PureTech", "1.5 BlueHDi"], packages: ["Active", "Allure", "GT"] }
    ]
  },
  {
    brand: "Renault",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg",
    series: [
      { name: "Clio", models: ["0.9 TCe", "1.0 Tce", "1.2 Joy", "1.5 dCi"], packages: ["Joy", "Touch", "Icon", "RS Line", "Evolution"] },
      { name: "Megane", models: ["1.3 TCe", "1.5 dCi", "1.6 16V"], packages: ["Joy", "Touch", "Icon", "RS Line"] },
      { name: "Taliant", models: ["1.0 SCe", "1.0 TCe"], packages: ["Joy", "Touch"] },
      { name: "Duster", models: ["1.0 TCe", "1.3 TCe", "1.5 dCi"], packages: ["Comfort", "Prestige", "Prestige Plus", "Journey"] } // Dacia da genelde iç içedir :)
    ]
  },
  {
    brand: "Toyota",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
    series: [
      { name: "Corolla", models: ["1.4 D-4D", "1.5 VVT-i", "1.6", "1.8 Hybrid"], packages: ["Vision", "Dream", "Flame", "Flame X-Pack", "Passion", "Passion X-Pack", "Advance", "Premium"] },
      { name: "Yaris", models: ["1.0", "1.5 Hybrid", "1.5 VVT-i"], packages: ["Vision", "Dream", "Flame"] },
      { name: "C-HR", models: ["1.2 T", "1.8 Hybrid"], packages: ["Advance", "Dynamic", "Diamond"] }
    ]
  },
  {
    brand: "Volkswagen",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
    series: [
      { name: "Golf", models: ["1.0 TSI", "1.4 TSI", "1.5 TSI", "1.6 TDI"], packages: ["Midline Plus", "Comfortline", "Highline", "Impression", "Life", "Style", "R-Line"] },
      { name: "Passat", models: ["1.4 TSI", "1.5 TSI", "1.6 TDI", "2.0 TDI"], packages: ["Trendline", "Comfortline", "Highline", "Impression", "Business", "Elegance"] },
      { name: "Polo", models: ["1.0 TSI", "1.2 TSI", "1.4 TDI"], packages: ["Trendline", "Comfortline", "Highline", "Life", "Style"] },
      { name: "Tiguan", models: ["1.4 TSI", "1.5 TSI", "2.0 TDI"], packages: ["Trendline", "Comfortline", "Highline", "Elegance", "R-Line"] }
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

async function wipeDatabase() {
  console.log("Veritabanı sıfırlanıyor...");
  await supabaseAdmin.from('car_taxonomy').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

async function seedData() {
  console.log('Premium Türkiye Piyasası Veri Entegrasyonu Başlıyor...');

  // Sort brands alphabetically
  const sortedBrands = TR_CAR_DATA.sort((a, b) => a.brand.localeCompare(b.brand));

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
      process.stdout.write(`\n  > Seri: ${seriesObj.name} \n`);
      
      // Sort models alphabetically
      const sortedModels = seriesObj.models.sort((a, b) => a.localeCompare(b));

      for (const modelName of sortedModels) {
        // Model adını "Seri Adı - Model" formatı daha şık gösterebilir, örn: "5 Serisi 520i"
        const displayModelName = seriesObj.name === modelName ? modelName : `${seriesObj.name} ${modelName}`;
        process.stdout.write(`    - Model: ${displayModelName} `);
        
        const { data: dbModel, error: modelErr } = await supabaseAdmin
          .from('car_taxonomy')
          .upsert({ 
            name: displayModelName, 
            slug: toSlug(displayModelName + "-" + brandObj.brand), 
            level: 'model', 
            parent_id: dbBrand.id 
          }, { onConflict: 'parent_id, name' })
          .select()
          .single();
          
        if (modelErr) continue;
        
        // Add TR Packages deep into the model
        if(seriesObj.packages) {
            const sortedPackages = seriesObj.packages.sort((a, b) => a.localeCompare(b));
            for (const pkgName of sortedPackages) {
               await supabaseAdmin
                 .from('car_taxonomy')
                 .upsert({ 
                   name: pkgName, 
                   slug: toSlug(pkgName + "-" + displayModelName), 
                   level: 'package',
                   parent_id: dbModel.id 
                 }, { onConflict: 'parent_id, name' });
            }
        }
      }
    }
  }

  console.log('\n✅ 🚀 Kusursuz Türkiye Piyasası Veri Entegrasyonu Tamamlandı!');
}

async function run() {
  await wipeDatabase();
  await seedData();
}

run();
