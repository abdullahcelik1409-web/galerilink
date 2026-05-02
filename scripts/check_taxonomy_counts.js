const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLevels() {
  const { data, error } = await supabase.rpc('get_taxonomy_counts');
  
  if (error) {
    // If RPC doesn't exist, try manual select
    const { data: allNodes, error: selectError } = await supabase.from('car_taxonomy').select('level');
    if (selectError) {
      console.error(selectError);
      return;
    }
    
    const counts = allNodes.reduce((acc, node) => {
      acc[node.level] = (acc[node.level] || 0) + 1;
      return acc;
    }, {});
    console.log('Level counts:', counts);
  } else {
    console.log('Level counts (RPC):', data);
  }
}

checkLevels();
