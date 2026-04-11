const { supabaseAdmin } = require('./utils/supabase-admin');

async function cleanDB() {
  console.log("Supabase 'car_taxonomy' tablosundaki tüm veriler siliniyor...");
  // Hepsini silmek için id'si boş olmayan her şeyi siliyoruz (Güvenli Wipe metodu)
  const { error } = await supabaseAdmin
    .from('car_taxonomy')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error("Silme hatası:", error.message);
  } else {
    console.log("Veri tabanı başarıyla temizlendi! Şimdi seed scripti otomatik tekrar çalıştırılmalı.");
  }
}

cleanDB();
