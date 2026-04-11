const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBrands() {
  const { data: brands, error } = await supabase
    .from('car_taxonomy')
    .select('id, name')
    .eq('level', 'marka');

  if (error) {
    console.error('Error fetching brands:', error);
    return;
  }

  console.log(`Found ${brands.length} brands total.`);

  let emptyCount = 0;
  for (const brand of brands) {
    const { count } = await supabase
      .from('car_taxonomy')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', brand.id);
    
    if (count === 0) {
      console.log(`Brand: ${brand.name} has 0 children.`);
      emptyCount++;
    } else {
      console.log(`Brand: ${brand.name} has ${count} models.`);
    }
  }
  
  console.log(`${emptyCount} brands have NO lower hierarchy.`);
}

checkBrands();
