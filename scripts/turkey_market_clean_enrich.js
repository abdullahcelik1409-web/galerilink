const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- TÜRKİYE'DE VAR OLAN MARKALAR (Beyaz Liste) ---
const TURKEY_WHITELIST_BRANDS = [
  "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "BYD", "Chery", "Citroen", "Cupra", "Dacia", 
  "DS Automobiles", "Ferrari", "Fiat", "Ford", "Honda", "Hyundai", "Jaguar", "Jeep", "Kia", "Lamborghini", 
  "Land Rover", "Lexus", "Maserati", "Mazda", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "Nissan", 
  "Opel", "Peugeot", "Porsche", "Renault", "Seat", "Skoda", "Smart", "SsangYong", "Subaru", "Suzuki", 
  "Tesla", "Togg", "Toyota", "Volkswagen", "Volvo", "Lada", "Mazda", "Tata", "Geely", "Leapmotor", 
  "Omoda", "Skywell", "Tofaş", "Chevrolet", "Chrysler" // Bazı eski modeller için Chrysler/Chevrolet kalsın (nadir de olsa binek var)
];

// --- HONDA MOTOSİKLET MODELLERİ (Kara Liste - Agresif) ---
const HONDA_MOTO_PATTERNS = [
  "CBR", "PCX", "FORZA", "GOLDWING", "AFRICA TWIN", "CB[0-9]", "VFR", "CRF", "ACTIVA", "DIO", 
  "NC750", "ADV", "SH125", "SH350", "MONKEY", "DAX", "VISION", "INTEGRA", "MSX", "C70", "C90",
  "599", "919", "ATC", "GL", "VT", "NC", "CBF", "XL", "SHADOW", "STEED", "TRANSALP", "VARADERO",
  "REBEL", "HORNET", "S-WING", "SPACY", "BEAT", "DYLAN", "PS150", "SES150", "PANTHEON"
];

// --- TİCARİ ARAÇ MODELLERİ (Kara Liste - Tam Temizlik) ---
const COMMERCIAL_PATTERNS = [
  "TRANSIT", "COURIER", "CONNECT", "CUSTOM", "DOBLO", "FIORINO", "DUCATO", "SCUDO", "TALENTO",
  "NEMO", "BERLINGO", "JUMPER", "JUMPY", "RELAY", "DISPATCH", "BIPPER", "BOXER", "EXPERT", 
  "PARTNER", "TRAVELLER", "MASTER", "KANGOO", "TRAFIC", "MASCOT", "CADDY", "TRANSPORTER", 
  "CARAVELLE", "MULTIVAN", "CRAFTER", "SPRINTER", "VITO", "V-CLASS", "HILUX", "L200", 
  "NAVARA", "D-MAX", "RANGER", "AMAROK", "FULLBACK", "PICKUP", "TRUCK", "VAN", "BUS", 
  "CAB-CHASSIS", "COMMERCIAL", "BOX", "CHASSIS", "PICK-UP"
];

// --- AUDI ZENGİNLEŞTİRME VERİSİ ---
const AUDI_ENRICHMENT = {
  "brand": "Audi",
  "series": [
    { name: "A1", models: ["A1 Sportback"] },
    { name: "A3", models: ["A3 Sedan", "A3 Sportback", "A3 Cabriolet"] },
    { name: "A4", models: ["A4 Sedan", "A4 Avant", "A4 Allroad"] },
    { name: "A5", models: ["A5 Sportback", "A5 Coupé", "A5 Cabriolet"] },
    { name: "A6", models: ["A6 Sedan", "A6 Avant", "A6 Allroad"] },
    { name: "A7", models: ["A7 Sportback"] },
    { name: "A8", models: ["A8 L"] },
    { name: "Q2", models: ["Q2"] },
    { name: "Q3", models: ["Q3", "Q3 Sportback"] },
    { name: "Q4", models: ["Q4 e-tron", "Q4 Sportback e-tron"] },
    { name: "Q5", models: ["Q5", "Q5 Sportback"] },
    { name: "Q7", models: ["Q7"] },
    { name: "Q8", models: ["Q8", "Q8 e-tron", "Q8 Sportback e-tron"] },
    { name: "S Serisi", models: ["S1", "S3", "S4", "S5", "S6", "S7", "S8", "SQ2", "SQ5", "SQ7", "SQ8"] },
    { name: "RS Serisi", models: ["RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8", "e-tron GT", "RS e-tron GT"] },
    { name: "TT", models: ["TT Coupé", "TT Roadster", "TT RS"] },
    { name: "R8", models: ["R8 Coupé", "R8 Spyder"] }
  ],
  "commonPackages": ["Advanced", "S Line", "Design", "Premium", "Quattro", "Sport"]
};

function toSlug(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function cleanAndEnrich() {
  console.log("🚀 TÜRKİYE PAZARI ÖZEL TEMİZLİK VE ZENGİNLEŞTİRME BAŞLIYOR...");

  // 1. MARKA TEMİZLİĞİ (Beyaz Liste Dışı Markalar)
  console.log("\n1. Türkiye'de olmayan markalar temizleniyor...");
  const { data: allBrands } = await supabase.from('car_taxonomy').select('id, name').eq('level', 'brand');
  
  const whitelistLower = TURKEY_WHITELIST_BRANDS.map(b => b.toLowerCase());
  const brandsToDelete = allBrands.filter(b => !whitelistLower.includes(b.name.toLowerCase()));
  
  if (brandsToDelete.length > 0) {
    console.log(`🗑️  ${brandsToDelete.length} adet yabancı marka siliniyor: ${brandsToDelete.map(b => b.name).join(', ')}`);
    const { error: brandDelErr } = await supabase.from('car_taxonomy').delete().in('id', brandsToDelete.map(b => b.id));
    if (brandDelErr) console.error("Marka silme hatası:", brandDelErr.message);
  }

  // 2. HONDA MOTOSİKLET TEMİZLİĞİ
  console.log("\n2. Honda motosiklet modelleri temizleniyor...");
  const { data: hondaBrand } = await supabase.from('car_taxonomy').select('id').eq('name', 'Honda').eq('level', 'brand').maybeSingle();
  
  if (hondaBrand) {
    // Seriler (Series) bazında temizlik
    const { data: hondaSeries } = await supabase.from('car_taxonomy').select('id, name').eq('parent_id', hondaBrand.id).eq('level', 'series');
    const motoRegex = new RegExp(`^(${HONDA_MOTO_PATTERNS.join('|')})$`, 'i');
    const motosToDelete = hondaSeries.filter(s => motoRegex.test(s.name) || HONDA_MOTO_PATTERNS.some(p => s.name.toUpperCase().includes(p.toUpperCase())));
    
    if (motosToDelete.length > 0) {
      console.log(`🗑️  ${motosToDelete.length} adet Honda motosiklet serisi siliniyor...`);
      await supabase.from('car_taxonomy').delete().in('id', motosToDelete.map(m => m.id));
    }
  }

  // 3. TİCARİ ARAÇ TEMİZLİĞİ (Tüm Markalar)
  console.log("\n3. Ticari araç modelleri temizleniyor...");
  const commercialRegex = new RegExp(COMMERCIAL_PATTERNS.join('|'), 'i');
  
  // Tüm serileri çekmek için sayfalama (2129 kayıt var)
  let allSeries = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: part, error } = await supabase
      .from('car_taxonomy')
      .select('id, name')
      .eq('level', 'series')
      .range(from, from + pageSize - 1);
    
    if (error || !part || part.length === 0) break;
    allSeries = allSeries.concat(part);
    if (part.length < pageSize) break;
    from += pageSize;
  }

  const commsToDelete = allSeries.filter(s => commercialRegex.test(s.name));
  
  if (commsToDelete.length > 0) {
    console.log(`🗑️  ${commsToDelete.length} adet ticari seri siliniyor...`);
    const ids = commsToDelete.map(c => c.id);
    for (let i = 0; i < ids.length; i += 100) {
        await supabase.from('car_taxonomy').delete().in('id', ids.slice(i, i + 100));
    }
  }

  // 4. AUDI ZENGİNLEŞTİRME (Hierarchical: Brand -> Series -> Model -> Package)
  console.log("\n4. Audi modelleri hiyerarşik olarak zenginleştiriliyor...");
  let audiId;
  const { data: existingAudi } = await supabase.from('car_taxonomy').select('id').eq('name', 'Audi').eq('level', 'brand').maybeSingle();
  
  if (!existingAudi) {
    const { data: newAudi } = await supabase.from('car_taxonomy').insert({ 
      name: 'Audi', 
      slug: 'audi', 
      level: 'brand',
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg"
    }).select().single();
    audiId = newAudi.id;
  } else {
    audiId = existingAudi.id;
  }

  for (const s of AUDI_ENRICHMENT.series) {
    // Önce mevcut "seri"yi (A3 vb.) alalım veya oluşturalım
    const { data: dbSeries } = await supabase.from('car_taxonomy').upsert({
      name: s.name,
      slug: toSlug(s.name + "-audi"),
      level: 'series',
      parent_id: audiId
    }, { onConflict: 'parent_id, name' }).select().single();

    if (dbSeries) {
      for (const mName of s.models) {
        // Model katmanı ekleniyor (A3 Sedan gibi)
        // DİKKAT: Üst seviyedeki paketler (A3 -> Package) varsa bunları sonradan temizleyeceğiz
        const { data: dbModel } = await supabase.from('car_taxonomy').upsert({
          name: mName,
          slug: toSlug(mName + "-audi"),
          level: 'model',
          parent_id: dbSeries.id
        }, { onConflict: 'parent_id, name' }).select().single();

        if (dbModel) {
            // Paketleri de modelin altına ekleyelim
            const pkgs = AUDI_ENRICHMENT.commonPackages.map(p => ({
                name: p,
                slug: toSlug(p + "-" + mName),
                level: 'package',
                parent_id: dbModel.id
            }));
            await supabase.from('car_taxonomy').upsert(pkgs, { onConflict: 'parent_id, name' });
        }
      }
      
      // Seri altında direkt "package" seviyesinde olan eski verileri temizle
      // Bu, A3 -> 1.6 TDI gibi doğrudan bağları siler, A3 -> A3 Sedan -> 1.6 TDI bağlarını korur.
      console.log(`  🧹 ${s.name} altındaki doğrudan paketler temizleniyor...`);
      await supabase.from('car_taxonomy').delete().eq('parent_id', dbSeries.id).eq('level', 'package');
    }
  }


  console.log("\n✨ TÜRKİYE MARKETİ TEMİZLİK VE ZENGİNLEŞTİRME TAMAMLANDI!");
}

cleanAndEnrich();

