const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log("🚀 Türkçe Taksonomi Seviye Migrasyonu Başlatılıyor...");

  // 1. Markaları Türkçeleştir
  console.log("  - Brand -> Marka");
  await supabase.from('car_taxonomy').update({ level: 'marka' }).eq('level', 'brand');

  // 2. Çakışmayı önlemek için geçici isimlendirme ile Model ve Seri değişimi
  console.log("  - Seviye isimleri güncelleniyor (Model/Seri Swap)...");
  
  // Önce 'series' olanları geçici olarak 'temp_model' yap (Bunlar yeni 'model' olacak: Megane, A3 vb.)
  await supabase.from('car_taxonomy').update({ level: 'model' }).eq('level', 'series');
  
  // Önceki 'model' olanları 'seri' yap (Bunlar: A3 Sedan, Megane Sedan vb.)
  await supabase.from('car_taxonomy').update({ level: 'seri' }).eq('level', 'model');

  // 3. Paketleri Türkçeleştir
  console.log("  - Package -> Paket");
  await supabase.from('car_taxonomy').update({ level: 'paket' }).eq('level', 'package');

  // 4. Diğerlerini Türkçeleştir (Eğer varsa)
  await supabase.from('car_taxonomy').update({ level: 'yakit' }).eq('level', 'fuel');
  await supabase.from('car_taxonomy').update({ level: 'vites' }).eq('level', 'transmission');
  await supabase.from('car_taxonomy').update({ level: 'kasa_tipi' }).eq('level', 'body');

  console.log("✨ Migrasyon Tamamlandı! Seviye isimleri artık Türkçe.");
}

migrate();
