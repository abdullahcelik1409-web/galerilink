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

// HAFİF TİCARİLER (Doblo, Courier, Caddy vb.) HARİÇ TUTULMUŞTUR!
const DEEP_MARKET_DATA = {
  "Volkswagen": {
    "Tiguan": { "1.5 TSI": [{motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"SUV", paket:"Life"}, {motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"SUV", paket:"Elegance"}, {motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"SUV", paket:"R-Line"}] },
    "T-Roc": { "1.5 TSI": [{motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Life"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Style"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"R-Line"}] },
    "Taigo": { "1.0 TSI": [{motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"Life"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"Style"}] },
    "Touareg": { "3.0 V6 TDI": [{motor:"3.0 V6 TDI", sanziman:"Otomatik", kasa:"SUV", paket:"Elegance"}, {motor:"3.0 V6 TDI", sanziman:"Otomatik", kasa:"SUV", paket:"R-Line"}] },
    "Arteon": { "1.5 TSI": [{motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"Sedan", paket:"Elegance"}, {motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"Sedan", paket:"R-Line"}] },
    "Passat": { "TSI": [{motor:"1.5 TSI", sanziman:"DSG", kasa:"Sedan", paket:"Impression"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"Sedan", paket:"Business"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"Sedan", paket:"Elegance"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"Sedan", paket:"R-Line"}] },
    "Golf": { "TSI": [{motor:"1.0 TSI", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Impression"}, {motor:"1.0 eTSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Life"}, {motor:"1.5 eTSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Style"}, {motor:"1.5 eTSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"R-Line"}], "TDI": [{motor:"1.6 TDI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Highline"}, {motor:"1.6 TDI", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Comfortline"}, {motor:"1.6 TDI", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Midline Plus"}] },
    "Polo": { "TSI": [{motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Life"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Style"}, {motor:"1.4 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Comfortline"}], "TDI": [{motor:"1.4 TDI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Trendline"}, {motor:"1.4 TDI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Comfortline"}] }
  },
  "Renault": {
    "Austral": { "Mild Hybrid": [{motor:"1.3 Mild Hybrid", sanziman:"Otomatik", kasa:"SUV", paket:"Techno Esprit Alpine"}, {motor:"1.3 Mild Hybrid", sanziman:"Otomatik", kasa:"SUV", paket:"Techno"}] },
    "Captur": { "TCe": [{motor:"1.3 TCe", sanziman:"EDC", kasa:"SUV", paket:"Touch Plus"}, {motor:"1.3 TCe", sanziman:"EDC", kasa:"SUV", paket:"Icon"}, {motor:"1.3 TCe", sanziman:"EDC", kasa:"SUV", paket:"R.S. Line"}] },
    "Taliant": { "TCe": [{motor:"1.0 Turbo X-tronic", sanziman:"Otomatik", kasa:"Sedan", paket:"Joy"}, {motor:"1.0 Turbo X-tronic", sanziman:"Otomatik", kasa:"Sedan", paket:"Touch"}] },
    "Kadjar": { "dCi": [{motor:"1.5 dCi", sanziman:"EDC", kasa:"SUV", paket:"Icon"}, {motor:"1.5 dCi", sanziman:"EDC", kasa:"SUV", paket:"Touch"}] },
    "Talisman": { "dCi": [{motor:"1.6 dCi", sanziman:"EDC", kasa:"Sedan", paket:"Icon"}, {motor:"1.5 dCi", sanziman:"EDC", kasa:"Sedan", paket:"Touch"}] },
    "Megane": { "TCe": [{motor:"1.3 TCe", sanziman:"EDC", kasa:"Sedan", paket:"Joy Comfort"}, {motor:"1.3 TCe", sanziman:"EDC", kasa:"Sedan", paket:"Touch"}, {motor:"1.3 TCe", sanziman:"EDC", kasa:"Sedan", paket:"Icon"}] },
    "Koleos": { "dCi": [{motor:"1.6 dCi", sanziman:"X-Tronic", kasa:"SUV", paket:"Icon"}] },
    "Megane E-Tech": { "EV": [{motor:"160 kW", sanziman:"Otomatik", kasa:"SUV", paket:"Techno"}, {motor:"160 kW", sanziman:"Otomatik", kasa:"SUV", paket:"Iconic"}] }
  },
  "Peugeot": {
    "208": { "PureTech": [{motor:"1.2 PureTech", sanziman:"EAT8", kasa:"Hatchback 5 Kapı", paket:"Active Prime"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"Hatchback 5 Kapı", paket:"Allure Selection"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"Hatchback 5 Kapı", paket:"GT"}] },
    "308": { "PureTech": [{motor:"1.2 PureTech", sanziman:"EAT8", kasa:"Hatchback 5 Kapı", paket:"Active Prime"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"Hatchback 5 Kapı", paket:"Allure"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"Hatchback 5 Kapı", paket:"GT"}] },
    "408": { "PureTech": [{motor:"1.2 PureTech", sanziman:"EAT8", kasa:"SUV", paket:"Allure"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"SUV", paket:"GT"}] },
    "508": { "BlueHDi": [{motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"Sedan", paket:"Active"}, {motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"Sedan", paket:"Allure"}, {motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"Sedan", paket:"GT Selection"}], "PureTech": [{motor:"1.6 PureTech", sanziman:"EAT8", kasa:"Sedan", paket:"GT Line"}] },
    "2008": { "PureTech": [{motor:"1.2 PureTech", sanziman:"EAT8", kasa:"SUV", paket:"Active"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"SUV", paket:"Allure"}, {motor:"1.2 PureTech", sanziman:"EAT8", kasa:"SUV", paket:"GT"}] },
    "3008": { "BlueHDi": [{motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"SUV", paket:"Active Prime"}, {motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"SUV", paket:"Allure"}, {motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"SUV", paket:"GT-Line"}] },
    "5008": { "BlueHDi": [{motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"SUV", paket:"Active Prime"}, {motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"SUV", paket:"Allure"}, {motor:"1.5 BlueHDi", sanziman:"EAT8", kasa:"SUV", paket:"GT"}] }
  },
  "Toyota": {
    "Yaris": { "Hybrid": [{motor:"1.5 Hybrid", sanziman:"e-CVT", kasa:"Hatchback 5 Kapı", paket:"Dream"}, {motor:"1.5 Hybrid", sanziman:"e-CVT", kasa:"Hatchback 5 Kapı", paket:"Flame"}, {motor:"1.5 Hybrid", sanziman:"e-CVT", kasa:"Hatchback 5 Kapı", paket:"Passion X-Pack"}] },
    "Yaris Cross": { "Hybrid": [{motor:"1.5 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Dream"}, {motor:"1.5 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Flame X-Pack"}, {motor:"1.5 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Passion X-Pack"}] },
    "Corolla": { "VVT-i": [{motor:"1.5", sanziman:"Multidrive S", kasa:"Sedan", paket:"Vision Plus"}, {motor:"1.5", sanziman:"Multidrive S", kasa:"Sedan", paket:"Dream"}, {motor:"1.5", sanziman:"Multidrive S", kasa:"Sedan", paket:"Flame X-Pack"}, {motor:"1.5", sanziman:"Multidrive S", kasa:"Sedan", paket:"Passion X-Pack"}] },
    "Corolla Cross": { "Hybrid": [{motor:"1.8 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Flame"}, {motor:"1.8 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Flame X-Pack"}, {motor:"1.8 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Passion X-Pack"}] },
    "C-HR": { "Hybrid": [{motor:"1.8 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Flame"}, {motor:"1.8 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Passion"}, {motor:"1.8 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Passion X-Pack"}] },
    "RAV4": { "Hybrid": [{motor:"2.5 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Flame"}, {motor:"2.5 Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Passion X-Pack"}] },
    "Camry": { "Hybrid": [{motor:"2.5 Hybrid", sanziman:"e-CVT", kasa:"Sedan", paket:"Passion"}] }
  },
  "Honda": {
    "Civic": { "VTEC Turbo": [{motor:"1.5 VTEC", sanziman:"CVT", kasa:"Sedan", paket:"Elegance"}, {motor:"1.5 VTEC", sanziman:"CVT", kasa:"Sedan", paket:"Executive+"}], "e:HEV": [{motor:"2.0 e:HEV Hybrid", sanziman:"e-CVT", kasa:"Hatchback 5 Kapı", paket:"Advance"}] },
    "City": { "i-VTEC": [{motor:"1.5 i-VTEC", sanziman:"CVT", kasa:"Sedan", paket:"Elegance"}, {motor:"1.5 i-VTEC", sanziman:"CVT", kasa:"Sedan", paket:"Executive"}] },
    "Accord": { "VTEC Turbo": [{motor:"1.5 VTEC", sanziman:"CVT", kasa:"Sedan", paket:"Executive"}, {motor:"1.5 VTEC", sanziman:"CVT", kasa:"Sedan", paket:"Executive+"}] },
    "HR-V": { "e:HEV": [{motor:"1.5 e:HEV Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Elegance"}, {motor:"1.5 e:HEV Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Advance"}, {motor:"1.5 e:HEV Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Advance Style"}] },
    "CR-V": { "i-MMD": [{motor:"2.0 i-MMD Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Executive"}, {motor:"2.0 i-MMD Hybrid", sanziman:"e-CVT", kasa:"SUV", paket:"Executive+"}] },
    "Jazz": { "e:HEV": [{motor:"1.5 e:HEV", sanziman:"e-CVT", kasa:"Hatchback 5 Kapı", paket:"Executive"}, {motor:"1.5 e:HEV", sanziman:"e-CVT", kasa:"Hatchback 5 Kapı", paket:"Crosstar Executive"}] }
  },
  "BMW": {
    "1 Serisi": { "118i": [{motor:"1.5", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Joy Plus"}, {motor:"1.5", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"First Edition M Sport"}, {motor:"1.5", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"M Sport"}] },
    "2 Serisi": { "218i": [{motor:"1.5", sanziman:"Otomatik", kasa:"Gran Coupe", paket:"First Edition M Sport"}, {motor:"1.5", sanziman:"Otomatik", kasa:"Gran Coupe", paket:"M Sport"}] },
    "3 Serisi": { "320i": [{motor:"1.6", sanziman:"Otomatik", kasa:"Sedan", paket:"First Edition M Sport"}, {motor:"1.6", sanziman:"Otomatik", kasa:"Sedan", paket:"M Sport"}, {motor:"1.6", sanziman:"Otomatik", kasa:"Sedan", paket:"Edition M Color"}] },
    "4 Serisi": { "420i": [{motor:"1.6", sanziman:"Otomatik", kasa:"Gran Coupe", paket:"M Sport"}] },
    "5 Serisi": { "520i": [{motor:"1.6", sanziman:"Otomatik", kasa:"Sedan", paket:"Luxury Line"}, {motor:"1.6", sanziman:"Otomatik", kasa:"Sedan", paket:"M Sport"}, {motor:"1.6", sanziman:"Otomatik", kasa:"Sedan", paket:"Special Edition M Sport"}] },
    "X1": { "sDrive18i": [{motor:"1.5", sanziman:"Otomatik", kasa:"SUV", paket:"M Sport"}] },
    "X2": { "sDrive18i": [{motor:"1.5", sanziman:"Otomatik", kasa:"SUV", paket:"M Sport X"}] },
    "X3": { "sDrive20i": [{motor:"1.6", sanziman:"Otomatik", kasa:"SUV", paket:"M Sport"}] },
    "X5": { "xDrive30d": [{motor:"3.0", sanziman:"Otomatik", kasa:"SUV", paket:"M Excellence"}] },
    "i4": { "eDrive40": [{motor:"250 kW", sanziman:"Otomatik", kasa:"Sedan", paket:"M Sport"}] }
  },
  "Mercedes-Benz": {
    "A-Serisi": { "A 200": [{motor:"1.3", sanziman:"Otomatik", kasa:"Sedan", paket:"AMG+"}, {motor:"1.3", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"AMG+"}] },
    "B-Serisi": { "B 180": [{motor:"1.3", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Progressive"}, {motor:"1.3", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"AMG"}] },
    "C-Serisi": { "C 200": [{motor:"1.5 Mild Hybrid", sanziman:"Otomatik", kasa:"Sedan", paket:"AMG"}, {motor:"1.5 Mild Hybrid", sanziman:"Otomatik", kasa:"Sedan", paket:"Edition 1 AMG"}] },
    "E-Serisi": { "E 180": [{motor:"1.5", sanziman:"Otomatik", kasa:"Sedan", paket:"AMG"}, {motor:"1.5", sanziman:"Otomatik", kasa:"Sedan", paket:"Exclusive"}] },
    "CLA": { "CLA 200": [{motor:"1.3", sanziman:"Otomatik", kasa:"Coupe", paket:"AMG+"}, {motor:"1.3", sanziman:"Otomatik", kasa:"Coupe", paket:"Edition 1 AMG"}] },
    "GLA": { "GLA 200": [{motor:"1.3", sanziman:"Otomatik", kasa:"SUV", paket:"AMG+"}] },
    "GLB": { "GLB 200": [{motor:"1.3", sanziman:"Otomatik", kasa:"SUV", paket:"AMG"}] },
    "GLC": { "GLC 180": [{motor:"1.5", sanziman:"Otomatik", kasa:"SUV", paket:"AMG"}] },
    "GLE": { "GLE 300 d": [{motor:"2.0", sanziman:"Otomatik", kasa:"SUV", paket:"AMG"}] }
  },
  "Fiat": {
    "Egea": { "Cross": [{motor:"1.4 Fire", sanziman:"Manuel", kasa:"SUV", paket:"Street"}, {motor:"1.4 Fire", sanziman:"Manuel", kasa:"SUV", paket:"Urban"}, {motor:"1.6 Multijet", sanziman:"Otomatik", kasa:"SUV", paket:"Lounge"}, {motor:"1.5 T4 Hybrid", sanziman:"Otomatik", kasa:"SUV", paket:"Lounge"}], "Sedan": [{motor:"1.4 Fire", sanziman:"Manuel", kasa:"Sedan", paket:"Easy"}, {motor:"1.4 Fire", sanziman:"Manuel", kasa:"Sedan", paket:"Urban"}, {motor:"1.3 Multijet", sanziman:"Manuel", kasa:"Sedan", paket:"Easy"}, {motor:"1.6 Multijet", sanziman:"Otomatik", kasa:"Sedan", paket:"Lounge"}, {motor:"1.5 T4 Hybrid", sanziman:"Otomatik", kasa:"Sedan", paket:"Lounge"}], "Hatchback": [{motor:"1.4 Fire", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Urban"}, {motor:"1.6 Multijet", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Lounge"}], "Station Wagon": [{motor:"1.6 Multijet", sanziman:"Otomatik", kasa:"Station Wagon", paket:"Lounge"}, {motor:"1.5 T4 Hybrid", sanziman:"Otomatik", kasa:"Station Wagon", paket:"Lounge"}] },
    "500": { "Hybrid": [{motor:"1.0 Hybrid", sanziman:"Manuel", kasa:"Hatchback 3 Kapı", paket:"Dolcevita"}] },
    "500X": { "FireFly": [{motor:"1.3 Firefly", sanziman:"Otomatik", kasa:"SUV", paket:"Sport Plus"}, {motor:"1.3 Firefly", sanziman:"Otomatik", kasa:"SUV", paket:"Cross Plus"}] },
    "500L": { "Multijet": [{motor:"1.3 Multijet", sanziman:"Manuel", kasa:"MPV", paket:"Cross Plus"}] },
    "Punto": { "Fire": [{motor:"1.4 Fire", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Popstar"}, {motor:"1.4 Fire", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Lounge"}] },
    "Linea": { "Multijet": [{motor:"1.3 Multijet", sanziman:"Manuel", kasa:"Sedan", paket:"Active Plus"}, {motor:"1.3 Multijet", sanziman:"Manuel", kasa:"Sedan", paket:"Pop"}] }
  },
  "Audi": {
    "A3": { "A3": [{motor:"35 TFSI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"S Line"}, {motor:"35 TFSI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Advanced"}, {motor:"35 TFSI", sanziman:"Otomatik", kasa:"Sedan", paket:"S Line"}, {motor:"35 TFSI", sanziman:"Otomatik", kasa:"Sedan", paket:"Advanced"}] },
    "A4": { "A4": [{motor:"40 TDI", sanziman:"Otomatik", kasa:"Sedan", paket:"Advanced"}, {motor:"45 TFSI Quattro", sanziman:"Otomatik", kasa:"Sedan", paket:"S Line"}] },
    "A5": { "A5": [{motor:"45 TFSI Quattro", sanziman:"Otomatik", kasa:"Sportback", paket:"S Line"}] },
    "A6": { "A6": [{motor:"40 TDI Quattro", sanziman:"Otomatik", kasa:"Sedan", paket:"Advanced"}, {motor:"40 TDI Quattro", sanziman:"Otomatik", kasa:"Sedan", paket:"S Line"}] },
    "A7": { "A7": [{motor:"50 TDI Quattro", sanziman:"Otomatik", kasa:"Sportback", paket:"S Line"}] },
    "A8": { "A8 L": [{motor:"50 TDI Quattro", sanziman:"Otomatik", kasa:"Sedan", paket:"Prestige"}] },
    "Q2": { "Q2": [{motor:"35 TFSI", sanziman:"Otomatik", kasa:"SUV", paket:"Advanced"}, {motor:"35 TFSI", sanziman:"Otomatik", kasa:"SUV", paket:"S Line"}] },
    "Q3": { "Q3": [{motor:"35 TFSI", sanziman:"Otomatik", kasa:"SUV", paket:"Advanced"}, {motor:"35 TFSI", sanziman:"Otomatik", kasa:"SUV", paket:"S Line"}] },
    "Q5": { "Q5": [{motor:"40 TDI Quattro", sanziman:"Otomatik", kasa:"SUV", paket:"Advanced"}, {motor:"40 TDI Quattro", sanziman:"Otomatik", kasa:"SUV", paket:"S Line"}] },
    "Q7": { "Q7": [{motor:"50 TDI Quattro", sanziman:"Otomatik", kasa:"SUV", paket:"S Line"}] },
    "Q8": { "Q8": [{motor:"50 TDI Quattro", sanziman:"Otomatik", kasa:"SUV", paket:"S Line"}] }
  },
  "Nissan": {
    "Qashqai": { "MHEV": [{motor:"1.3 DIG-T MHEV", sanziman:"Otomatik", kasa:"SUV", paket:"Designpack"}, {motor:"1.3 DIG-T MHEV", sanziman:"Otomatik", kasa:"SUV", paket:"Tekna"}, {motor:"1.3 DIG-T MHEV", sanziman:"Otomatik", kasa:"SUV", paket:"Skypack"}, {motor:"1.3 DIG-T MHEV", sanziman:"Otomatik", kasa:"SUV", paket:"Platinum Premium"}], "e-Power": [{motor:"1.5 e-Power", sanziman:"Otomatik", kasa:"SUV", paket:"Skypack"}, {motor:"1.5 e-Power", sanziman:"Otomatik", kasa:"SUV", paket:"Platinum Premium"}] },
    "Juke": { "DIG-T": [{motor:"1.0 DIG-T", sanziman:"Manuel", kasa:"SUV", paket:"Tekna"}, {motor:"1.0 DIG-T", sanziman:"Otomatik", kasa:"SUV", paket:"Tekna"}, {motor:"1.0 DIG-T", sanziman:"Otomatik", kasa:"SUV", paket:"Platinum"}] },
    "Micra": { "IG-T": [{motor:"1.0 IG-T", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Tekna"}] },
    "X-Trail": { "e-Power": [{motor:"1.5 e-4ORCE", sanziman:"Otomatik", kasa:"SUV", paket:"Skypack"}, {motor:"1.5 e-4ORCE", sanziman:"Otomatik", kasa:"SUV", paket:"Platinum Premium"}] }
  },
  "Hyundai": {
    "i10": { "MPI": [{motor:"1.0 MPI", sanziman:"AMT", kasa:"Hatchback 5 Kapı", paket:"Jump"}, {motor:"1.2 MPI", sanziman:"AMT", kasa:"Hatchback 5 Kapı", paket:"Style"}, {motor:"1.2 MPI", sanziman:"AMT", kasa:"Hatchback 5 Kapı", paket:"Elite"}] },
    "i20": { "MPI": [{motor:"1.4 MPI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Jump"}, {motor:"1.4 MPI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Style"}, {motor:"1.4 MPI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Elite"}], "T-GDI": [{motor:"1.0 T-GDI", sanziman:"DCT", kasa:"Hatchback 5 Kapı", paket:"Style"}] },
    "Bayon": { "MPI": [{motor:"1.4 MPI", sanziman:"Otomatik", kasa:"SUV", paket:"Jump"}, {motor:"1.4 MPI", sanziman:"Otomatik", kasa:"SUV", paket:"Style"}], "T-GDI": [{motor:"1.0 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Elite"}] },
    "Kona": { "T-GDI": [{motor:"1.0 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Style"}] },
    "Tucson": { "T-GDI": [{motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Comfort"}, {motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Prime Plus"}, {motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Elite"}, {motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Elite Plus"}], "CRDi": [{motor:"1.6 CRDi", sanziman:"DCT", kasa:"SUV", paket:"Elite Plus"}] },
    "Elantra": { "MPI": [{motor:"1.6 MPI", sanziman:"CVT", kasa:"Sedan", paket:"Style"}, {motor:"1.6 MPI", sanziman:"CVT", kasa:"Sedan", paket:"Smart"}, {motor:"1.6 MPI", sanziman:"CVT", kasa:"Sedan", paket:"Elite"}] }
  },
  "Kia": {
    "Picanto": { "MPI": [{motor:"1.0 MPI", sanziman:"AMT", kasa:"Hatchback 5 Kapı", paket:"Feel"}, {motor:"1.0 MPI", sanziman:"AMT", kasa:"Hatchback 5 Kapı", paket:"Live"}, {motor:"1.0 MPI", sanziman:"AMT", kasa:"Hatchback 5 Kapı", paket:"Cool"}] },
    "Rio": { "MPI": [{motor:"1.2 MPI", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Cool"}, {motor:"1.4 MPI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Elegance"}, {motor:"1.4 MPI", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Prestige"}] },
    "Stonic": { "MPI": [{motor:"1.4 MPI", sanziman:"Otomatik", kasa:"SUV", paket:"Cool"}, {motor:"1.4 MPI", sanziman:"Otomatik", kasa:"SUV", paket:"Elegance"}], "T-GDI": [{motor:"1.0 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Prestige"}] },
    "Ceed": { "MPI": [{motor:"1.4 MPI", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Cool"}], "MHEV": [{motor:"1.5 T-GDI MHEV", sanziman:"DCT", kasa:"Hatchback 5 Kapı", paket:"Elegance"}] },
    "Sportage": { "T-GDI": [{motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Cool"}, {motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Elegance Konfor"}, {motor:"1.6 T-GDI", sanziman:"DCT", kasa:"SUV", paket:"Prestige Smart"}] },
    "Sorento": { "Hybrid": [{motor:"1.6 T-GDI Hybrid", sanziman:"Otomatik", kasa:"SUV", paket:"Prestige Smart"}] }
  },
  "Ford": {
    "Fiesta": { "EcoBoost": [{motor:"1.0 EcoBoost", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Titanium"}, {motor:"1.0 EcoBoost mHEV", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Titanium"}] },
    "Focus": { "Ti-VCT": [{motor:"1.5 Ti-VCT", sanziman:"Manuel", kasa:"Sedan", paket:"Trend X"}, {motor:"1.5 Ti-VCT", sanziman:"Otomatik", kasa:"Sedan", paket:"Trend X"}, {motor:"1.5 Ti-VCT", sanziman:"Otomatik", kasa:"Sedan", paket:"Titanium"}], "EcoBoost": [{motor:"1.0 EcoBoost MHEV", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"Titanium"}, {motor:"1.0 EcoBoost MHEV", sanziman:"Otomatik", kasa:"Hatchback 5 Kapı", paket:"ST-Line"}, {motor:"1.0 EcoBoost MHEV", sanziman:"Otomatik", kasa:"Sedan", paket:"Titanium X"}] },
    "Puma": { "EcoBoost": [{motor:"1.0 EcoBoost", sanziman:"Otomatik", kasa:"SUV", paket:"Style"}, {motor:"1.0 EcoBoost", sanziman:"Otomatik", kasa:"SUV", paket:"ST-Line"}] },
    "Kuga": { "EcoBoost": [{motor:"1.5 EcoBoost", sanziman:"Otomatik", kasa:"SUV", paket:"Style"}, {motor:"1.5 EcoBoost", sanziman:"Otomatik", kasa:"SUV", paket:"ST-Line"}], "Duratorq": [{motor:"1.5 TDCi", sanziman:"Otomatik", kasa:"SUV", paket:"Titanium"}] },
    "Mustang Mach-E": { "Elektrik": [{motor:"Standart Menzil", sanziman:"Otomatik", kasa:"SUV", paket:"AWD"}, {motor:"Uzun Menzil", sanziman:"Otomatik", kasa:"SUV", paket:"AWD"}] }
  },
  "Skoda": {
    "Fabia": { "TSI": [{motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Premium"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Monte Carlo"}] },
    "Scala": { "TSI": [{motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Comfort"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Elite"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Premium"}] },
    "Kamiq": { "TSI": [{motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"Elite"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"Premium"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Premium"}] },
    "Octavia": { "TSI": [{motor:"1.0 TSI e-Tec", sanziman:"DSG", kasa:"Sedan", paket:"Elite"}, {motor:"1.0 TSI e-Tec", sanziman:"DSG", kasa:"Sedan", paket:"Premium"}, {motor:"1.5 TSI e-Tec", sanziman:"DSG", kasa:"Sedan", paket:"Premium"}, {motor:"1.5 TSI e-Tec", sanziman:"DSG", kasa:"Sedan", paket:"Sportline"}] },
    "Karoq": { "TSI": [{motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Elite"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Premium"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Prestige"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Sportline"}] },
    "Superb": { "TSI": [{motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"Sedan", paket:"Premium"}, {motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"Sedan", paket:"Prestige"}, {motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"Sedan", paket:"Sportline"}, {motor:"1.5 TSI ACT", sanziman:"DSG", kasa:"Sedan", paket:"L&K Crystal"}], "TDI": [{motor:"2.0 TDI", sanziman:"DSG", kasa:"Sedan", paket:"Prestige"}, {motor:"2.0 TDI", sanziman:"DSG", kasa:"Sedan", paket:"L&K Crystal"}] },
    "Kodiaq": { "TSI": [{motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Premium"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Prestige"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Sportline"}] }
  },
  "Seat": {
    "Ibiza": { "TSI": [{motor:"1.0 TSI", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Style"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Style"}] },
    "Arona": { "TSI": [{motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"Style"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"Xperience"}, {motor:"1.0 TSI", sanziman:"DSG", kasa:"SUV", paket:"FR"}] },
    "Leon": { "TSI": [{motor:"1.0 eTSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"Style"}, {motor:"1.5 eTSI", sanziman:"DSG", kasa:"Hatchback 5 Kapı", paket:"FR"}] },
    "Ateca": { "TSI": [{motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Xperience"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"FR"}] },
    "Tarraco": { "TSI": [{motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"Xcellence"}, {motor:"1.5 TSI", sanziman:"DSG", kasa:"SUV", paket:"FR"}] }
  },
  "Dacia": {
    "Sandero": { "Stepway": [{motor:"1.0 TCe", sanziman:"Manuel", kasa:"Hatchback 5 Kapı", paket:"Essential"}, {motor:"1.0 TCe", sanziman:"X-Tronic", kasa:"Hatchback 5 Kapı", paket:"Essential"}, {motor:"1.0 TCe", sanziman:"X-Tronic", kasa:"Hatchback 5 Kapı", paket:"Expression"}, {motor:"1.0 TCe", sanziman:"X-Tronic", kasa:"Hatchback 5 Kapı", paket:"Extreme"}] },
    "Duster": { "TCe": [{motor:"1.0 TCe", sanziman:"Manuel", kasa:"SUV", paket:"Essential"}, {motor:"1.3 TCe", sanziman:"EDC", kasa:"SUV", paket:"Expression"}, {motor:"1.3 TCe", sanziman:"EDC", kasa:"SUV", paket:"Journey"}], "Blue dCi": [{motor:"1.5 Blue dCi", sanziman:"Manuel", kasa:"SUV", paket:"Essential"}, {motor:"1.5 Blue dCi", sanziman:"Manuel", kasa:"SUV", paket:"Expression"}] },
    "Jogger": { "TCe": [{motor:"1.0 TCe", sanziman:"Manuel", kasa:"Station Wagon", paket:"Essential"}, {motor:"1.0 TCe", sanziman:"Manuel", kasa:"Station Wagon", paket:"Expression"}, {motor:"1.0 TCe", sanziman:"Manuel", kasa:"Station Wagon", paket:"Extreme"}] }
  },
  "Chery": {
    "Omoda 5": { "TGDI": [{motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Comfort"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Luxury"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Excellent"}] },
    "Tiggo 7 Pro": { "TGDI": [{motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Comfort"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Luxury"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Excellent"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Avantgarde"}] },
    "Tiggo 8 Pro": { "TGDI": [{motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Luxury"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Excellent"}, {motor:"1.6 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Avantgarde"}] },
    "Tiggo 8 Pro Max": { "TGDI": [{motor:"2.0 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Excellent"}, {motor:"2.0 TGDI", sanziman:"Otomatik", kasa:"SUV", paket:"Avantgarde"}] }
  }
};

async function deepEnrich() {
  console.log("🚀 DERİN ZENGİNLEŞTİRME BAŞLADI...");
  console.log("Not: Sadece binek ve SUV araçlar eklenecek, ticari araçlar ve kombiler bilerek dışarıda bırakılmıştır.");
  
  const { data: brands } = await supabase.from('car_taxonomy').select('id, name').eq('level', 'marka');
  const validBrandIds = {};
  brands.forEach(b => {
    validBrandIds[b.name.toLowerCase()] = b.id;
  });

  for (const [brandName, modelsObj] of Object.entries(DEEP_MARKET_DATA)) {
    const brandKey = brandName.toLowerCase();
    
    let brandId = validBrandIds[brandKey];
    if (!brandId) {
      console.log(`+ YENİ MARKA EKLENİYOR: ${brandName}`);
      const newB = await upsertNode(brandName, 'marka', null);
      if(newB) {
         brandId = newB.id;
         validBrandIds[brandKey] = brandId;
      }
    }
    if (!brandId) continue;

    console.log(`📦 İşleniyor: ${brandName}`);

    for (const [modelName, seriesObj] of Object.entries(modelsObj)) {
      const modelNode = await upsertNode(modelName, 'model', brandId);
      if (!modelNode) continue;

      for (const [seriesName, packagesArr] of Object.entries(seriesObj)) {
        const seriNode = await upsertNode(seriesName, 'seri', modelNode.id);
        if (!seriNode) continue;

        const motorCache = {};
        const sanzimanCache = {};
        const kasaCache = {};

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

  console.log("✅ DERİN ZENGİNLEŞTİRME BAŞARIYLA TAMAMLANDI!");
  console.log("Tüm paketler, motor boyutları, vites tipleri ve kasalar başarıyla hiyerarşiye eklendi.");
}

deepEnrich();
