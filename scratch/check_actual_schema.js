const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: cols, error: colError } = await supabase.rpc('fetch_table_columns', { table_name: 'cars' });
  
  if (colError) {
    // Fallback: try raw query if RPC doesn't exist
    const { data, error } = await supabase.from('cars').select('*').limit(1);
    if (error) {
      console.error('Error fetching cars:', error);
      return;
    }
    console.log('Cars Columns (Keys):', Object.keys(data[0] || {}));
  } else {
    console.log('Cars Columns:', cols);
  }

  const { data: tax, error: taxError } = await supabase.from('car_taxonomy').select('*').limit(1);
  if (!taxError) {
      console.log('Taxonomy Columns:', Object.keys(tax[0] || {}));
  }
}

checkSchema();
