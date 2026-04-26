const { createClient } = require('@supabase/supabase-js');

// Service Role Key from supabase-admin.js
const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDIxNCwiZXhwIjoyMDkwNjM2MjE0fQ.52xjpbbLVsQ71o4DRlZ4pUzMJtvYkxWKqLyFdJlBw7c';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function extractTaxonomy() {
    console.log('Extracting existing taxonomy from database...');
    
    const { data, error } = await supabaseAdmin
        .from('car_taxonomy')
        .select('id, parent_id, name, level, slug');

    if (error) {
        console.error('Error fetching taxonomy:', error);
        return;
    }

    const fs = require('fs');
    fs.writeFileSync('existing_taxonomy.json', JSON.stringify(data, null, 2));
    console.log(`Success! Extracted ${data.length} records to existing_taxonomy.json`);
}

extractTaxonomy();
