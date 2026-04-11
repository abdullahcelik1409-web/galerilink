import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hierarchy, children, targetChildLevel, filters } = body;
    
    if (!hierarchy || hierarchy.length === 0) {
      return NextResponse.json({ error: "No hierarchy provided" }, { status: 400, headers: corsHeaders });
    }

    let parentId = null;

    // 1. Process Hierarchy (Brand -> Series -> Model)
    for (const item of hierarchy) {
      const slug = toSlug(item.name);
      
      const result = await supabaseAdmin
        .from('car_taxonomy')
        .upsert({
          name: item.name,
          slug,
          level: item.level,
          parent_id: parentId
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();
        
      if (result.error) {
        // If upsert conflicts (e.g., null parent_id uniqueness issue), just select it
        const { data: existingData } = await supabaseAdmin
          .from('car_taxonomy')
          .select('id')
          .eq('name', item.name)
          .eq('level', item.level)
          .is('parent_id', parentId)
          .single();
        if (existingData) {
           parentId = (existingData as any).id;
        } else {
           throw result.error;
        }
      } else if (result.data) {
        parentId = (result.data as any).id;
      }
    }

    let count = 0;

    // 2. Process Children (e.g. Packages or Models)
    if (children && children.length > 0 && targetChildLevel) {
      for (const childName of children) {
        const slug = toSlug(childName);
        const { error } = await supabaseAdmin
          .from('car_taxonomy')
          .upsert({
            name: childName,
            slug,
            level: targetChildLevel,
            parent_id: parentId
          }, { onConflict: 'parent_id, name' });
          
        if (!error) count++;
      }
    }

    // 3. Process Filters (Body Type, Fuel, Transmission, etc.)
    if (filters) {
      for (const [filterType, options] of Object.entries(filters)) {
        for (const optName of (options as string[])) {
          const slug = toSlug(optName);
          const { error } = await supabaseAdmin
            .from('car_taxonomy')
            .upsert({
              name: optName,
              slug,
              level: filterType,
              parent_id: parentId 
            }, { onConflict: 'parent_id, name' });
            
          if (!error) count++;
        }
      }
    }

    return NextResponse.json({ success: true, count }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Scraper API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
