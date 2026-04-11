const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

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

const EXTRA_DATA = {
  "Volvo": {
    "S60": { "2.0 B4": [{motor: "2.0 MHEV", sanziman: "Otomatik", kasa: "Sedan", paket: "Plus"}] },
    "XC90": { "2.0 B5": [{motor: "2.0", sanziman: "Otomatik", kasa: "SUV", paket: "Inscription"}] },
    "V90": { "Cross Country": [{motor: "2.0", sanziman: "Otomatik", kasa: "Station Wagon", paket: "Pro"}] }
  },
  "Skoda": {
    "Octavia": { "1.0 TSI": [{motor: "1.0", sanziman: "DSG", kasa: "Sedan", paket: "Premium"}], "1.5 TSI": [{motor: "1.5 TSI", sanziman: "DSG", kasa: "Sedan", paket: "Premium"}] },
    "Superb": { "1.5 TSI": [{motor: "1.5 TSI ACT", sanziman: "DSG", kasa: "Sedan", paket: "Prestige"}] },
    "Kamiq": { "1.0 TSI": [{motor: "1.0 TSI", sanziman: "DSG", kasa: "SUV", paket: "Elite"}] }
  },
  "Seat": {
    "Leon": { "1.5 eTSI": [{motor: "1.5 eTSI", sanziman: "DSG", kasa: "Hatchback 5 Kapı", paket: "FR"}] },
    "Ibiza": { "1.0 TSI": [{motor: "1.0 TSI", sanziman: "DSG", kasa: "Hatchback 5 Kapı", paket: "Style"}] },
    "Arona": { "1.0 TSI": [{motor: "1.0 TSI", sanziman: "DSG", kasa: "SUV", paket: "Xperience"}] }
  },
  "Citroen": {
    "C3": { "1.2 PureTech": [{motor: "1.2 PureTech", sanziman: "Manuel", kasa: "Hatchback 5 Kapı", paket: "Feel"}] },
    "C4": { "1.2 PureTech": [{motor: "1.2 PureTech", sanziman: "Otomatik", kasa: "SUV", paket: "Shine"}] },
    "C5 Aircross": { "1.5 BlueHDi": [{motor: "1.5 BlueHDi", sanziman: "Otomatik", kasa: "SUV", paket: "Shine Bold"}] }
  },
  "Kia": {
    "Sportage": { "1.6 T-GDI": [{motor: "1.6 T-GDI", sanziman: "Otomatik", kasa: "SUV", paket: "Elegance Konfor"}] },
    "Ceed": { "1.4 MPI": [{motor: "1.4 MPI", sanziman: "Manuel", kasa: "Hatchback 5 Kapı", paket: "Cool"}] },
    "Picanto": { "1.0 MPI": [{motor: "1.0 MPI", sanziman: "Manuel", kasa: "Hatchback 5 Kapı", paket: "Feel"}] }
  },
  "Dacia": {
    "Duster": { "1.3 TCe": [{motor: "1.3 TCe", sanziman: "EDC", kasa: "SUV", paket: "Journey"}, {motor: "1.5 dCi", sanziman: "Manuel", kasa: "SUV", paket: "Essential"}] },
    "Sandero": { "Stepway": [{motor: "1.0 TCe", sanziman: "Yarı Otomatik", kasa: "Hatchback 5 Kapı", paket: "Expression"}] }
  },
  "Nissan": {
    "Qashqai": { "1.3 DIG-T": [{motor: "1.3 DIG-T MHEV", sanziman: "X-Tronic", kasa: "SUV", paket: "Tekna"}, {motor: "1.3 DIG-T MHEV", sanziman: "X-Tronic", kasa: "SUV", paket: "Platinum Premium"}] },
    "Juke": { "1.0 DIG-T": [{motor: "1.0 DIG-T", sanziman: "Manuel", kasa: "SUV", paket: "Tekna"}] }
  },
  "Chery": {
    "Tiggo 8 Pro": { "1.6 TGDI": [{motor: "1.6 TGDI", sanziman: "Otomatik", kasa: "SUV", paket: "Luxury"}] },
    "Tiggo 7 Pro": { "1.6 TGDI": [{motor: "1.6 TGDI", sanziman: "Otomatik", kasa: "SUV", paket: "Comfort"}] },
    "Omoda 5": { "1.6 T": [{motor: "1.6 TGDI", sanziman: "Otomatik", kasa: "SUV", paket: "Excellent"}] }
  },
  "Togg": {
    "T10X": { "V1": [{motor: "160 kW Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "RWD Standart Menzil"}], "V2": [{motor: "160 kW Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "RWD Uzun Menzil"}] }
  },
  "Tesla": {
    "Model Y": { "Long Range": [{motor: "Çift Motor Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "Long Range AWD"}], "Standard": [{motor: "Tek Motor Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "Standart Menzil Arkadan İtiş"}] },
    "Model 3": { "Long Range": [{motor: "Çift Motor Elektrik", sanziman: "Otomatik", kasa: "Sedan", paket: "Long Range"}] }
  },
  "Tofaş": {
    "Şahin": { "1.6": [{motor: "1.6", sanziman: "Manuel", kasa: "Sedan", paket: "S"}] },
    "Doğan": { "1.6": [{motor: "1.6", sanziman: "Manuel", kasa: "Sedan", paket: "SLX"}] },
    "Kartal": { "1.6": [{motor: "1.6", sanziman: "Manuel", kasa: "Station Wagon", paket: "SLX"}] }
  },
  "Alfa Romeo": {
    "Tonale": { "1.5 MHEV": [{motor: "1.5", sanziman: "Otomatik", kasa: "SUV", paket: "Ti"}] },
    "Giulia": { "2.0": [{motor: "2.0 280hp", sanziman: "Otomatik", kasa: "Sedan", paket: "Veloce"}] }
  },
  "Jeep": {
    "Renegade": { "1.0 GSE": [{motor: "1.0", sanziman: "Manuel", kasa: "SUV", paket: "Longitude"}] },
    "Compass": { "1.3 T4": [{motor: "1.3", sanziman: "Otomatik", kasa: "SUV", paket: "Limited"}] }
  },
  "Land Rover": {
    "Range Rover": { "3.0 MHEV": [{motor: "3.0 D", sanziman: "Otomatik", kasa: "SUV", paket: "Autobiography"}] },
    "Defender": { "2.0": [{motor: "2.0", sanziman: "Otomatik", kasa: "SUV", paket: "SE"}] }
  },
  "Porsche": {
    "Macan": { "2.0": [{motor: "2.0 265 Ps", sanziman: "Otomatik", kasa: "SUV", paket: "Standart"}] },
    "Taycan": { "4S": [{motor: "Elektrik 530 PS", sanziman: "Otomatik", kasa: "Sedan", paket: "Performance"}] },
    "911": { "Carrera S": [{motor: "3.0 450 hp", sanziman: "Otomatik", kasa: "Coupe", paket: "Carrera S"}] }
  },
  "Mg": {
    "HS": { "1.5 T-GDI": [{motor: "1.5", sanziman: "Otomatik", kasa: "SUV", paket: "Luxury"}] },
    "MG4": { "Electric": [{motor: "Tam Elektrik 150 kW", sanziman: "Otomatik", kasa: "Hatchback", paket: "Luxury"}] }
  },
  "Cupra": {
    "Formentor": { "1.5 TSI": [{motor: "1.5 TSI", sanziman: "DSG", kasa: "SUV", paket: "VZ"}] },
    "Leon": { "1.5 eTSI": [{motor: "1.5 eTSI", sanziman: "DSG", kasa: "Hatchback 5 Kapı", paket: "VZ"}] }
  },
  "Mini": {
    "Cooper": { "1.5": [{motor: "1.5", sanziman: "Otomatik", kasa: "Hatchback", paket: "Signature"}] },
    "Countryman": { "1.5": [{motor: "1.5", sanziman: "Otomatik", kasa: "SUV", paket: "ALL4"}] }
  },
  "Mazda": {
    "3": { "1.5 Skyactiv-G": [{motor: "1.5", sanziman: "Otomatik", kasa: "Hatchback 5 Kapı", paket: "Power"}] },
    "CX-5": { "2.0 Skyactiv-G": [{motor: "2.0", sanziman: "Otomatik", kasa: "SUV", paket: "Power Sense"}] }
  },
  "Suzuki": {
    "Swift": { "1.2 MHEV": [{motor: "1.2 Hybrid", sanziman: "Otomatik", kasa: "Hatchback 5 Kapı", paket: "GLX Premium"}] },
    "Vitara": { "1.4 MHEV": [{motor: "1.4 Boosterjet Hybrid", sanziman: "Otomatik", kasa: "SUV", paket: "GLX Premium"}] }
  },
  "Subaru": {
    "XV": { "1.6 e-Boxer": [{motor: "1.6 Hybrid", sanziman: "Otomatik", kasa: "SUV", paket: "Xtreme"}] },
    "Forester": { "2.0 e-Boxer": [{motor: "2.0 Hybrid", sanziman: "Otomatik", kasa: "SUV", paket: "e-Boxer"}] }
  },
  "Byd": {
    "Atto 3": { "Design": [{motor: "150 kW Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "Design"}] },
    "Seal": { "U": [{motor: "Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "Design"}] }
  },
  "Geely": {
    "Emgrand": { "EC7": [{motor: "1.5", sanziman: "Manuel", kasa: "Sedan", paket: "GS"}] }
  },
  "Maserati": {
    "Ghibli": { "2.0": [{motor: "2.0 Hybrid 330 hp", sanziman: "Otomatik", kasa: "Sedan", paket: "GT"}] },
    "Grecale": { "2.0 MHEV": [{motor: "2.0", sanziman: "Otomatik", kasa: "SUV", paket: "GT"}] }
  },
  "Aston Martin": {
    "Vantage": { "4.0 V8": [{motor: "4.0", sanziman: "Otomatik", kasa: "Coupe", paket: "V8"}] }
  },
  "Ferrari": {
    "Roma": { "3.9 V8": [{motor: "3.9 V8", sanziman: "Otomatik", kasa: "Coupe", paket: "Standart"}] }
  },
  "Lamborghini": {
    "Urus": { "4.0 V8": [{motor: "4.0 V8", sanziman: "Otomatik", kasa: "SUV", paket: "S"}] },
    "Huracan": { "5.2 V10": [{motor: "5.2 V10", sanziman: "Otomatik", kasa: "Coupe", paket: "EVO"}] }
  },
  "Bentley": {
    "Continental GT": { "4.0 V8": [{motor: "4.0 V8", sanziman: "Otomatik", kasa: "Coupe", paket: "Mulliner"}] }
  },
  "Jaguar": {
    "F-Pace": { "2.0 D": [{motor: "2.0 Diesel", sanziman: "Otomatik", kasa: "SUV", paket: "R-Dynamic HSE"}] }
  },
  "Mitsubishi": {
    "Space Star": { "1.2": [{motor: "1.2", sanziman: "Yarı Otomatik", kasa: "Hatchback 5 Kapı", paket: "Intense"}] },
    "Lancer": { "1.6": [{motor: "1.6", sanziman: "Otomatik", kasa: "Sedan", paket: "Invite"}] }
  },
  "Ssangyong": {
    "Torres": { "EVX": [{motor: "152 kW Elektrik", sanziman: "Otomatik", kasa: "SUV", paket: "Luxury"}] },
    "Korando": { "1.5 T-GDI": [{motor: "1.5 T", sanziman: "Otomatik", kasa: "SUV", paket: "Platinum"}] }
  },
  "Smart": {
    "ForTwo": { "0.9": [{motor: "0.9 Turbo", sanziman: "Otomatik", kasa: "Hatchback 3 Kapı", paket: "Prime"}] }
  },
  "Leapmotor": {
    "T03": { "Standart": [{motor: "Elektirik 80 kW", sanziman: "Otomatik", kasa: "Hatchback 5 Kapı", paket: "Standart"}] }
  },
  "Omoda": {
    "5": { "1.6 TGDI": [{motor: "1.6", sanziman: "Otomatik", kasa: "SUV", paket: "Excellent"}] }
  },
  "Skywell": {
    "ET5": { "Legend": [{motor: "Tam Elektrik 150 kW", sanziman: "Otomatik", kasa: "SUV", paket: "Long Range"}] }
  },
  "Tata": {
    "Indica": { "1.4": [{motor: "1.4", sanziman: "Manuel", kasa: "Hatchback 5 Kapı", paket: "Trend"}] }
  },
  "Chrysler": {
    "300C": { "3.0 CRD": [{motor: "3.0 V6 Diesel", sanziman: "Otomatik", kasa: "Sedan", paket: "Touring"}] }
  },
  "Chevrolet": {
    "Cruze": { "1.6": [{motor: "1.6 124 HP", sanziman: "Manuel", kasa: "Sedan", paket: "LT"}, {motor: "1.6 124 HP", sanziman: "Otomatik", kasa: "Sedan", paket: "LT"}] },
    "Aveo": { "1.2": [{motor: "1.2", sanziman: "Manuel", kasa: "Hatchback 5 Kapı", paket: "S"}] },
    "Captiva": { "2.0 D": [{motor: "2.0 Diesel", sanziman: "Otomatik", kasa: "SUV", paket: "High"}] }
  }
};

async function seedExtraBrands() {
  console.log("Boş kalan markaları doldurma işlemi başlatılıyor...");
  
  const { data: brands } = await supabase.from('car_taxonomy').select('id, name').eq('level', 'marka');
  const validBrandIds = {};
  brands.forEach(b => {
    validBrandIds[b.name.toLowerCase()] = b.id;
  });

  for (const [brandName, modelsObj] of Object.entries(EXTRA_DATA)) {
    const brandKey = brandName.toLowerCase();
    
    // Check if brand exists
    let brandId = validBrandIds[brandKey];
    if (!brandId) {
      console.log(`Yeni marka açılıyor: ${brandName}`);
      const newB = await upsertNode(brandName, 'marka', null);
      if(newB) {
         brandId = newB.id;
         validBrandIds[brandKey] = brandId;
      }
    }
    
    if (!brandId) {
       console.log(`Uyarı: ${brandName} için marka ID'si bulunamadı veya yaratılamadı.`);
       continue;
    }

    console.log(`📦 İşleniyor: ${brandName}`);

    // MODEL DÖNGÜSÜ
    for (const [modelName, seriesObj] of Object.entries(modelsObj)) {
      const modelNode = await upsertNode(modelName, 'model', brandId);
      if (!modelNode) continue;

      // SERİ DÖNGÜSÜ
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

  console.log("✅ Boş markalar başarıyla modellere/serilere kavuştu!");
}

seedExtraBrands();
