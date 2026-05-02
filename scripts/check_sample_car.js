const { supabaseAdmin } = require('./utils/supabase-admin');

async function checkSampleCar() {
  const { data, error } = await supabaseAdmin.from('cars').select('brand, series, model, year, fuel, body_type, transmission, engine, package_id').limit(1);
  if (data && data.length > 0) {
    console.log('Sample Car Data:', data[0]);
  } else if (error) {
    console.error('Error:', error.message);
  }
}

checkSampleCar();
