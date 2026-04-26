const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const parentId = '5ccac3a5-ddf3-476c-8f9e-b16a303ae285'; // Otomobil Kategori ID
const level = 'yil';
const missingYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

async function fixYears() {
  console.log('Eksik yıllar ekleniyor...');
  
  for (const year of missingYears) {
    const slug = `${year}-yil-5cca`;
    const { data, error } = await supabase
      .from('car_taxonomy')
      .upsert({
        name: year,
        level: level,
        parent_id: parentId,
        slug: slug,
        status: 'approved'
      }, { onConflict: 'parent_id, name' });

    if (error) {
      console.error(`Hata (${year}):`, error.message);
    } else {
      console.log(`${year} başarıyla eklendi/güncellendi.`);
    }
  }
  
  console.log('İşlem tamamlandı.');
}

fixYears();
