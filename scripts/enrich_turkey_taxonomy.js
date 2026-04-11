const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TURKEY_TAXONOMY_MAP = {
  "Renault": {
    "Megane": ["1.5 dCi Joy", "1.5 dCi Touch", "1.3 TCe Icon", "1.3 TCe Touch", "1.5 Blue dCi Icon"],
    "Clio": ["1.0 Sce Joy", "1.0 TCe Touch", "1.0 TCe Icon", "1.5 dCi Joy", "1.5 Blue dCi Touch"],
    "Symbol": ["1.2 Joy", "1.5 dCi Joy", "1.5 dCi Touch"],
    "Fluence": ["1.5 dCi Joy", "1.5 dCi Touch", "1.5 dCi Icon", "1.5 dCi Business"]
  },
  "Fiat": {
    "Egea": ["1.3 Multijet Easy", "1.3 Multijet Urban", "1.6 Multijet Lounge", "1.4 Fire Easy", "1.6 Multijet Urban Plus"],
    "Linea": ["1.3 Multijet Active Plus", "1.3 Multijet Pop", "1.3 Multijet Emotion", "1.6 Multijet Lounge"]
  },
  "Volkswagen": {
    "Golf": ["1.6 TDI Comfortline", "1.6 TDI Highline", "1.0 TSI Midline Plus", "1.5 TSI Style", "1.2 TSI Comfortline"],
    "Passat": ["1.6 TDI Comfortline", "2.0 TDI Highline", "1.5 TSI Elegance", "1.4 TSI Trendline", "1.6 TDI Elegance"],
    "Polo": ["1.4 TDI Comfortline", "1.0 TSI Trendline", "1.2 TSI Comfortline", "1.0 TSI Elegance"]
  },
  "Audi": {
    "A3": ["Sedan 35 TFSI Advanced", "Sedan 30 TFSI Sport", "Sportback 35 TFSI S Line", "Sedan 1.6 TDI Dynamic"],
    "A4": ["Sedan 40 TDI Quattro Design", "Sedan 45 TFSI Quattro S Line"],
    "A6": ["Sedan 40 TDI Quattro Exclusive", "Sedan 50 TDI Quattro Sport"]
  },
  "BMW": {
    "3 Serisi": ["320i iED 40. Yıl Otomatik Sedan", "320d M Sport Otomatik Sedan", "320i M Sport Otomatik Sedan"],
    "5 Serisi": ["520d Comfort Otomatik Sedan", "520i Executive Otomatik Sedan"]
  },
  "Mercedes-Benz": {
    "C-Serisi": ["C 180 Fascination Otomatik Sedan", "C 200 d AMG Otomatik Sedan", "C 180 Style Otomatik Sedan"],
    "E-Serisi": ["E 180 Edition E Otomatik Sedan", "E 220 d Exclusive Otomatik Sedan"]
  }
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

/**
 * Zeki Ayrıştırıcı: "Sedan 35 TFSI Advanced" -> { motor, sanziman, kasa, paket }
 */
function parseSpecs(seriesName, specStr) {
  const s = specStr.toLowerCase();
  
  let motor = "Standart";
  let sanziman = "Manuel";
  let kasa = "Sedan";
  let paket = "Standart";

  // 1. Motor Tespiti
  const motorMatch = specStr.match(/\d\.\d\s\w+|\d+\s\w+/i);
  if (motorMatch) motor = motorMatch[0];

  // 2. Şanzıman Tespiti
  if (s.includes("otomatik") || s.includes("dsg") || s.includes("s-tronic") || s.includes("edc") || s.includes("tiptronic")) {
    sanziman = "Otomatik";
  } else if (s.includes("yarı otomatik")) {
    sanziman = "Yarı Otomatik";
  }

  // 3. Kasa Tespiti
  if (s.includes("sportback") || s.includes("hatchback") || s.includes("hb")) kasa = "Hatchback";
  else if (s.includes("avant") || s.includes("sw") || s.includes("station")) kasa = "Station Wagon";
  else if (s.includes("coupe")) kasa = "Coupe";
  else if (s.includes("cabrio")) kasa = "Cabrio";

  // 4. Paket Tespiti (Cümlenin sonundaki genelde pakettir)
  const parts = specStr.split(' ');
  paket = parts[parts.length - 1];
  
  // Eğer paket ismi motor veya kasa ile aynıysa bir önceki kelimeye bak
  if ((paket.toLowerCase() === kasa.toLowerCase() || motor.includes(paket)) && parts.length > 1) {
      paket = parts[parts.length - 2];
  }

  return { motor, sanziman, kasa, paket };
}

async function upsertNode(name, level, parentId) {
  const { data, error } = await supabase.from('car_taxonomy').upsert({
    name,
    level,
    parent_id: parentId,
    slug: toSlug(name + "-" + level + (parentId ? "-" + parentId.substring(0,4) : ""))
  }, { onConflict: 'parent_id, name' }).select().single();
  
  if (error) {
    console.error(`Error upserting ${name} (${level}):`, error.message);
    return null;
  }
  return data;
}

async function startEnrichment() {
  console.log("🚀 7 Katmanlı Taksonomi Zenginleştirme Başlıyor...");

  for (const [brandName, seriesData] of Object.entries(TURKEY_TAXONOMY_MAP)) {
    console.log(`\n📦 [${brandName}] işleniyor...`);
    
    // 1. MARKA
    const markaNode = await upsertNode(brandName, 'marka', null);
    if (!markaNode) continue;

    for (const [seriesName, specs] of Object.entries(seriesData)) {
      // 2. MODEL (Megane, A3 vb.)
      const modelNode = await upsertNode(seriesName, 'model', markaNode.id);
      if (!modelNode) continue;

      // 3. SERİ (Genelde Model ile aynı veya Sedan/Sportback ayrımı için kullanılır)
      // Kullanıcının istediği hiyerarşide Seri 3. sırada.
      const seriNode = await upsertNode(seriesName, 'seri', modelNode.id);
      if (!seriNode) continue;

      for (const specStr of specs) {
        const parsed = parseSpecs(seriesName, specStr);
        
        // 4. MOTOR
        const motorNode = await upsertNode(parsed.motor, 'motor', seriNode.id);
        if (!motorNode) continue;

        // 5. ŞANZIMAN
        const sanzimanNode = await upsertNode(parsed.sanziman, 'sanziman', motorNode.id);
        if (!sanzimanNode) continue;

        // 6. KASA
        const kasaNode = await upsertNode(parsed.kasa, 'kasa', sanzimanNode.id);
        if (!kasaNode) continue;

        // 7. PAKET
        await upsertNode(parsed.paket, 'paket', kasaNode.id);
      }
    }
  }

  console.log("\n✨ 7 Katmanlı Hiyerarşi Başarıyla Oluşturuldu!");
}

startEnrichment();
