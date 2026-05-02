const { supabaseAdmin } = require('./utils/supabase-admin');

async function checkCarsSchema() {
  const { data, error } = await supabaseAdmin.from('cars').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Cars table columns:', Object.keys(data[0]));
  } else if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('No data in cars table to check columns.');
  }
}

checkCarsSchema();
