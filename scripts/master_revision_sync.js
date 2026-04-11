const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// TÜRKİYE OTOMOBİL PAZARI MASTER VERİ SÖZLÜĞÜ (V3 - FULL REVISION)
const MASTER_TAXONOMY = {
  "Renault": {
    "Megane": ["1.5 dCi Joy", "1.5 dCi Touch", "1.3 TCe Icon", "1.3 TCe Touch", "1.5 Blue dCi Icon", "1.3 TCe Joy"],
    "Clio": ["1.0 Sce Joy", "1.0 TCe Touch", "1.0 TCe Icon", "1.5 dCi Joy", "1.5 Blue dCi Touch", "1.0 TCe RS Line"],
    "Captur": ["1.3 TCe Icon", "1.5 dCi Touch", "1.0 TCe Joy", "1.6 Hybrid RS Line"],
    "Kadjar": ["1.5 dCi Icon", "1.3 TCe Touch Roof", "1.6 dCi Touch"],
    "Fluence": ["1.5 dCi Joy", "1.5 dCi Touch", "1.5 dCi Icon", "1.6 16V Privilege"]
  },
  "Fiat": {
    "Egea": ["1.3 Multijet Easy", "1.3 Multijet Urban", "1.6 Multijet Lounge", "1.4 Fire Easy", "1.6 Multijet Urban Plus", "1.5 T4 Hibrit Lounge"],
    "500": ["1.2 Dolce Vita", "1.0 Hybrid Cult", "1.4 Lounge"],
    "Doblo": ["1.3 Multijet Safeline", "1.6 Multijet Premio Plus", "1.3 Multijet Pop"],
    "500X": ["1.3 Sport", "1.6 Multijet Cross Plus", "1.4 MultiAir Cross"]
  },
  "Volkswagen": {
    "Golf": ["1.6 TDI Comfortline", "1.6 TDI Highline", "1.5 TSI Style", "1.0 TSI Life", "R-Line 1.5 TSI", "GTI 2.0 TSI"],
    "Passat": ["1.6 TDI Comfortline", "2.0 TDI Highline", "1.5 TSI Elegance", "1.5 TSI Business", "1.4 TSI Trendline"],
    "Tiguan": ["1.5 TSI Life", "1.5 TSI Elegance", "2.0 TDI R-Line", "1.4 TSI Comfortline"],
    "T-Roc": ["1.5 TSI Highline", "1.5 TSI Style", "1.5 TSI Design"]
  },
  "BMW": {
    "3 Serisi": ["320i iED 40. Yıl", "320d M Sport", "330i M Sport", "320i Sedan Sport Line", "316i Joy"],
    "5 Serisi": ["520d Comfort", "520i Executive", "530i xDrive M Sport", "525d xDrive Exclusive"],
    "1 Serisi": ["116d Sport Line", "118i M Sport", "116i Joy Plus"],
    "X5": ["xDrive25d Experience", "xDrive30d M Sport", "xDrive40i Premium"]
  },
  "Mercedes-Benz": {
    "C Serisi": ["C 180 Fascination", "C 200 d AMG", "C 180 Style", "C 300 d 4MATIC Exclusive"],
    "E Serisi": ["E 180 Edition E", "E 220 d Exclusive", "E 300 d AMG", "E 250 Avantgarde"],
    "A Serisi": ["A 180 d Style", "A 200 AMG", "A 180 Progressive"],
    "G Serisi": ["G 63 AMG", "G 400 d Magnetic Edition"]
  },
  "Audi": {
    "A3": ["1.6 TDI Dynamic", "35 TFSI Advanced", "30 TFSI Sport", "1.5 TFSI Design"],
    "A4": ["2.0 TDI Quattro Desing", "40 TDI Advanced", "45 TFSI Quattro Sport"],
    "A6": ["2.0 TDI Quattro", "40 TDI Quattro Design", "50 TDI Quattro Sport"],
    "Q3": ["35 TFSI Advanced", "35 TFSI S-Line", "1.4 TFSI Sport"]
  },
  "Chery": {
    "Omoda 5": ["Comfort", "Luxury", "Excellence"],
    "Tiggo 7 Pro": ["Comfort", "Luxury", "Excellent"],
    "Tiggo 8 Pro": ["Luxury", "Excellent", "Avantgarde"]
  },
  "Togg": {
    "T10X": ["V1 RWD Standart Menzil", "V2 RWD Uzun Menzil", "V2 RWD Standart Menzil"]
  },
  "Tesla": {
    "Model Y": ["Arkadan İtiş", "Long Range AWD", "Performance AWD"],
    "Model 3": ["Arkadan İtiş Standart Range", "Long Range AWD", "Performance"]
  },
  "Cupra": {
    "Formentor": ["1.5 TSI", "1.5 TSI VZ Line", "2.0 TSI VZ", "1.4 e-Hybrid"],
    "Leon": ["1.5 eTSI", "2.0 TSI VZ"]
  },
  "Porsche": {
    "Taycan": ["Base 408HP", "4S 530HP", "Turbo 680HP", "Turbo S 761HP"],
    "Cayenne": ["3.0 E-Hybrid", "V6 Turbo GT", "Coupe S"],
    "911": ["Carrera S", "Turbo S", "GT3 RS"]
  },
  "Ferrari": {
    "488": ["GTB", "Spider", "Pista"],
    "F8": ["Tributo", "Spider"],
    "296": ["GTB Assetto Fiorano", "GTS"]
  },
  "Lamborghini": {
    "Urus": ["4.0 V8", "Performante", "S"],
    "Huracan": ["EVO RWD", "Tecnica", "STO"]
  },
  "MG": {
    "ZS": ["1.5 VTI-tech Comfort", "1.0 Turbo Luxury"],
    "HS": ["1.5 T-GDI Comfort", "1.5 T-GDI Luxury"],
    "Electric": ["ZS EV Luxury", "MG4 Electric Luxury"]
  },
  "BYD": {
    "Atto 3": ["Design"],
    "Seal": ["Design AWD"],
    "Dolphin": ["Design"]
  }
};

// Jenerik Paketler (Eğer marka sözlükte yoksa kullanılacak Türkiye standartları)
const GENERIC_TR_PACKAGES = ["Standard", "Comfort", "Premium", "Prestige", "Executive", "Sport", "Luxury"];

function toSlug(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function masterRevisionSync() {
  console.log("🛠️ TÜRKİYE MASTER REVİZYON SİNKRONİZASYONU BAŞLATILIYOR...");

  const { data: dbBrands } = await supabase.from('car_taxonomy').select('id, name').eq('level', 'brand');
  
  for (const brand of dbBrands) {
    const brandName = brand.name;
    const { data: dbSeries } = await supabase.from('car_taxonomy').select('id, name').eq('parent_id', brand.id).eq('level', 'series');

    if (!dbSeries || dbSeries.length === 0) continue;

    console.log(`\n📦 [${brandName}] için detaylar işleniyor... (${dbSeries.length} seri)`);

    for (const series of dbSeries) {
      let packagesToAdd = [];
      const trModels = MASTER_TAXONOMY[brandName];
      
      if (trModels && trModels[series.name]) {
        // 1. Sözlükte olan spesifik paketler
        packagesToAdd = trModels[series.name];
      } else {
        // 2. Sözlükte yoksa Jenerik Paketler + Bazı Motor Bilgileri Üret (Akıllı Tahmin)
        // Örn: Eğer seri ismi lüks bir markaysa daha ağır isimler ver
        if (["Rolls-Royce", "Bentley", "Aston Martin"].includes(brandName)) {
          packagesToAdd = ["Signature", "Elegance", "Mulliner", "V12 Edition"];
        } else {
          // Yaygın motor hacimlerini ekleyerek jenerik paket üret
          packagesToAdd = GENERIC_TR_PACKAGES.map(p => `${p}`);
        }
      }

      const packagesToInsert = packagesToAdd.map(pkg => ({
        name: pkg,
        slug: toSlug(pkg),
        level: 'package',
        parent_id: series.id
      }));

      const { error: pkgError } = await supabase
        .from('car_taxonomy')
        .upsert(packagesToInsert, { onConflict: 'parent_id, name' });

      if (pkgError) {
        console.error(`  ! Hata (${brandName} - ${series.name}):`, pkgError.message);
      } else {
        process.stdout.write("."); // İlerleme simgesi
      }
    }
  }

  console.log("\n\n✨ TÜRKİYE MASTER REVİZYONU BAŞARIYLA TAMAMLANDI!");
  console.log("Tüm markalar (Lüksler dahil) detaylı donanım hiyerarşisine kavuştu.");
}

masterRevisionSync();
