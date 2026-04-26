const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';
const OTOMOBIL_ROOT_ID = '5ccac3a5-ddf3-476c-8f9e-b16a303ae285';
const CONCURRENCY_LIMIT = 5; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- EXTRACTION HELPERS ---
function extractAttributes(config) {
    const text = (config.package_name + " " + (config.raw_type_name || "")).toUpperCase();
    
    let transmission = config.transmission;
    if (!transmission) {
        if (text.match(/\b(AT|AUTO|OTOMATIK|TCT|DCT|EAT|EDC|DSG|S-TRONIC|CVT|E-CVT|MULTITRONIC|SHIFT)\b/)) {
            transmission = "Otomatik";
        } else if (text.match(/\b(MT|MANUEL|MANUAL)\b/)) {
            transmission = "Manuel";
        } else if (config.fuel_type === "Elektrik") {
            transmission = "Otomatik";
        }
    }

    let body = config.body_type;
    if (!body) {
        if (text.match(/\b(SEDAN)\b/)) body = "Sedan";
        else if (text.match(/\b(HB|HATCHBACK)\b/)) body = "Hatchback";
        else if (text.match(/\b(SUV|CROSSOVER|CUV)\b/)) body = "SUV";
        else if (text.match(/\b(COUPE|COUPE)\b/)) body = "Coupe";
        else if (text.match(/\b(CABRIO|CONVERTIBLE|ROADSTER)\b/)) body = "Cabrio";
        else if (text.match(/\b(SW|STATION|AVANT|TOURING|WAGON)\b/)) body = "Station Wagon";
    }

    return {
        transmission: transmission || "Manuel", // Defaulting to Manuel if unknown
        body: body || "Sedan" // Defaulting to Sedan if unknown
    };
}

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
            status: 'approved',
            ...extra
        }, { onConflict: 'parent_id, name' })
        .select()
        .single();
        
    if (error) {
        if (error.code === '23505') { 
             const { data: existing } = await supabase.from('car_taxonomy').select().eq('parent_id', parentId).eq('name', name).single();
             return existing;
        }
        console.error(`Error upserting ${level} [${name}]:`, error.message);
        return null;
    }
    return data;
}

async function main() {
    console.log('🚀 Starting SMARTER deep taxonomy enrichment (2020-2026)...');

    const excelData = JSON.parse(fs.readFileSync('vehicles_database.json', 'utf8'));
    const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

    for (const year of years) {
        console.log(`\n📅 Processing Year: ${year}`);
        
        const yearNode = await upsertNode(year.toString(), 'yil', OTOMOBIL_ROOT_ID);
        if (!yearNode) continue;

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
                        const { transmission, body } = extractAttributes(config);

                        const steps = [
                            { name: config.fuel_type || "Belirtilmemiş", level: 'yakit' },
                            { name: body, level: 'kasa' },
                            { name: transmission, level: 'sanziman' },
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
    }

    console.log('\n✅ SMARTER taxonomy enrichment complete!');
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
