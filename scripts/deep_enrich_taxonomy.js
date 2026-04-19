const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';
const OTOMOBIL_ROOT_ID = '5ccac3a5-ddf3-476c-8f9e-b16a303ae285';
const CONCURRENCY_LIMIT = 5; // Process 5 brands in parallel

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- HELPERS ---
function toSlug(text, level, parentPrefix) {
    if (!text) return "";
    const clean = text.toString().toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `${clean}-${level}-${parentPrefix}`;
}

async function upsertNode(name, level, parentId, extra = {}) {
    if (!name) return null;
    const parentPrefix = parentId ? parentId.substring(0, 4) : 'root';
    const slug = toSlug(name, level, parentPrefix);
    
    const { data, error } = await supabase
        .from('car_taxonomy')
        .upsert({
            name,
            level,
            parent_id: parentId,
            slug,
            ...extra
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();
        
    if (error) {
        if (error.code === '23505') { // Conflict racing
             const { data: existing } = await supabase.from('car_taxonomy').select().eq('parent_id', parentId).eq('name', name).single();
             return existing;
        }
        console.error(`Error upserting ${level} [${name}]:`, error.message);
        return null;
    }
    return data;
}

// --- MAIN PROCESS ---
async function main() {
    console.log('🚀 Starting OPTIMIZED deep taxonomy enrichment (2000-2026)...');

    const excelData = JSON.parse(fs.readFileSync('vehicles_database.json', 'utf8'));
    const existingData = JSON.parse(fs.readFileSync('existing_taxonomy.json', 'utf8'));

    // Pre-process existing legacy data
    const legacyLookup = {};
    const existingBrands = existingData.filter(d => d.level === 'marka' || d.level === 'brand');
    
    existingBrands.forEach(brand => {
        const models = existingData.filter(d => d.parent_id === brand.id && (d.level === 'seri' || d.level === 'model' || d.level === 'series'));
        legacyLookup[brand.name.toUpperCase()] = {
            name: brand.name,
            logo_url: brand.logo_url,
            models: models.map(m => m.name)
        };
    });

    const years = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2000 + i).reverse();

    for (const year of years) {
        console.log(`\n📅 Processing Year: ${year}`);
        
        const yearNode = await upsertNode(year.toString(), 'yil', OTOMOBIL_ROOT_ID);
        if (!yearNode) continue;

        if (year >= 2012) {
            // Split brands into chunks for parallel processing
            for (let i = 0; i < excelData.length; i += CONCURRENCY_LIMIT) {
                const chunk = excelData.slice(i, i + CONCURRENCY_LIMIT);
                
                await Promise.all(chunk.map(async (brandObj) => {
                    const activeModels = brandObj.models.filter(m => 
                        m.configurations.some(c => c.active_years.includes(year))
                    );

                    if (activeModels.length === 0) return;

                    const brandNode = await upsertNode(brandObj.brand, 'marka', yearNode.id);
                    if (!brandNode) return;

                    console.log(`  └─ ${brandObj.brand} (${activeModels.length} models)`);

                    for (const modelObj of activeModels) {
                        const seriesNode = await upsertNode(modelObj.model_name, 'seri', brandNode.id);
                        if (!seriesNode) continue;

                        const configs = modelObj.configurations.filter(c => c.active_years.includes(year));
                        
                        for (const config of configs) {
                            let currentNode = seriesNode;

                            const steps = [
                                { name: config.fuel_type || "Belirtilmemiş", level: 'yakit' },
                                { name: config.body_type || "Standart Kasa", level: 'kasa' },
                                { name: config.transmission || "Standart Şanzıman", level: 'sanziman' },
                                { name: config.engine_size || "Belirtilmemiş Motor", level: 'motor' },
                                { name: config.package_name || "Standart Paket", level: 'paket' }
                            ];

                            for (const step of steps) {
                                const nextNode = await upsertNode(step.name, step.level, currentNode.id);
                                if (!nextNode) break;
                                currentNode = nextNode;
                            }
                        }
                    }
                }));
            }
        } else {
            // Legacy path is faster, but we'll still do chunks
            const legacyBrands = Object.values(legacyLookup);
            for (let i = 0; i < legacyBrands.length; i += CONCURRENCY_LIMIT) {
                const chunk = legacyBrands.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.all(chunk.map(async (legacyBrand) => {
                    const brandNode = await upsertNode(legacyBrand.name, 'marka', yearNode.id, { logo_url: legacyBrand.logo_url });
                    if (!brandNode) return;

                    for (const modelName of legacyBrand.models) {
                        await upsertNode(modelName, 'seri', brandNode.id);
                    }
                }));
            }
        }
    }

    console.log('\n✅ Optimized taxonomy enrichment complete!');
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
