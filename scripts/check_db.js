const { supabaseAdmin } = require('./utils/supabase-admin');

async function checkTables() {
  console.log('Veri tabanı tabloları kontrol ediliyor...');
  const { error } = await supabaseAdmin.from('car_taxonomy').select('*').limit(1);
  
  if (error && error.code === 'PGRST116') {
     // Table not found or similar
     console.log('car_taxonomy tablosu bulunamadı. Migration çalıştırılmalıdır.');
  } else if (error) {
     console.error('Hata:', error.message);
  } else {
     console.log('Tablolar hazır.');
  }
}

checkTables();
