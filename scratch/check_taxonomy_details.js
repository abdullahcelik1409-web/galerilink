const { supabaseAdmin } = require('../scripts/utils/supabase-admin');

async function verify() {
  console.log('--- FINAL 7-LEVEL TR VERIFICATION START ---');
  
  // 1. Level Distribution (Pagination inclusive)
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: part } = await supabaseAdmin.from('car_taxonomy').select('level').range(from, from + pageSize - 1);
    if (!part || part.length === 0) break;
    allRows = allRows.concat(part);
    if (part.length < pageSize) break;
    from += pageSize;
  }
  const levelCounts = allRows.reduce((acc, curr) => {
    acc[curr.level] = (acc[curr.level] || 0) + 1;
    return acc;
  }, {});
  console.log('Final Level Distribution:', levelCounts);

  // 2. Sample Hierarchy (Audi A3)
  const { data: audiMarka } = await supabaseAdmin.from('car_taxonomy').select('id').eq('name', 'Audi').eq('level', 'marka').single();
  if (audiMarka) {
    const { data: a3Model } = await supabaseAdmin.from('car_taxonomy').select('id').eq('name', 'A3').eq('parent_id', audiMarka.id).eq('level', 'model').single();
    if (a3Model) {
      const { data: a3Seri } = await supabaseAdmin.from('car_taxonomy').select('id').eq('name', 'A3').eq('parent_id', a3Model.id).eq('level', 'seri').single();
      if (a3Seri) {
        const { data: a3Motor } = await supabaseAdmin.from('car_taxonomy').select('id, name').eq('parent_id', a3Seri.id).eq('level', 'motor').limit(1).single();
        if (a3Motor) {
          const { data: a3Sanziman } = await supabaseAdmin.from('car_taxonomy').select('id, name').eq('parent_id', a3Motor.id).eq('level', 'sanziman').limit(1).single();
          if (a3Sanziman) {
             const { data: a3Kasa } = await supabaseAdmin.from('car_taxonomy').select('id, name').eq('parent_id', a3Sanziman.id).eq('level', 'kasa').limit(1).single();
             if (a3Kasa) {
                const { data: a3Paket } = await supabaseAdmin.from('car_taxonomy').select('name').eq('parent_id', a3Kasa.id).eq('level', 'paket').limit(1).single();
                console.log(`✅ Hierarchy: Audi -> A3 -> A3 -> ${a3Motor.name} -> ${a3Sanziman.name} -> ${a3Kasa.name} -> ${a3Paket.name}`);
             }
          }
        }
      }
    }
  }

  // 3. BMW check
  const { data: bmwMarka } = await supabaseAdmin.from('car_taxonomy').select('id').eq('name', 'BMW').eq('level', 'marka').single();
  const { data: bmwModels } = await supabaseAdmin.from('car_taxonomy').select('name').eq('parent_id', bmwMarka.id).eq('level', 'model');
  console.log('BMW Models:', bmwModels?.map(m => m.name));

  console.log('--- FINAL 7-LEVEL TR VERIFICATION END ---');
}

verify();
