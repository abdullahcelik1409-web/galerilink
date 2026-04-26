const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Turkish alphabet for sorting (case-insensitive mapping)
const TR_ALPHABET = "abcçdefgğhıijklmnoöprsştuüvyz";
const TR_CHARS = {
    'Ç': 'ç', 'Ğ': 'ğ', 'I': 'ı', 'İ': 'i', 'Ö': 'ö', 'Ş': 'ş', 'Ü': 'ü',
    'C': 'c', 'G': 'g', 'O': 'o', 'S': 's', 'U': 'u', 'I': 'i'
};

function trLowercase(str) {
    if (!str) return '';
    return str.toString().replace(/[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]/g, (m) => {
        const mapped = TR_CHARS[m];
        return mapped || m.toLowerCase();
    }).toLowerCase();
}

function trSortKey(s) {
    if (typeof s !== 'string') return s;
    const lower = trLowercase(s);
    return Array.from(lower).map(c => {
        const idx = TR_ALPHABET.indexOf(c);
        return idx !== -1 ? idx.toString().padStart(2, '0') : c;
    }).join('');
}

function processVehicles() {
    const inputFile = path.join(__dirname, '202604R2.xlsx');
    const outputFile = path.join(process.cwd(), 'vehicles.json');

    console.log(`Reading ${inputFile}...`);
    try {
        const workbook = XLSX.readFile(inputFile);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: 0 });

        console.log(`Processing ${data.length} rows...`);

        const brandCol = "Marka Adı";
        const modelCol = "Tip Adı";
        const years = Array.from({ length: 2026 - 2012 + 1 }, (_, i) => (2026 - i).toString());

        // Grouping
        const brandsMap = new Map();

        data.forEach(row => {
            const brand = (row[brandCol] || '').toString().trim();
            const model = (row[modelCol] || '').toString().trim();

            if (!brand || !model) return;

            if (!brandsMap.has(brand)) {
                brandsMap.set(brand, new Map());
            }

            const modelsMap = brandsMap.get(brand);
            if (!modelsMap.has(model)) {
                modelsMap.set(model, new Set());
            }

            const activeYears = modelsMap.get(model);
            years.forEach(year => {
                // xlsx usually reads headers as they are. Check both string and potentially numeric if it was converted
                const val = row[year];
                if (val > 0) {
                    activeYears.add(parseInt(year));
                }
            });
        });

        // Convert Map to Array and Sort
        const result = Array.from(brandsMap.entries())
            .map(([brand, modelsMap]) => {
                const models = Array.from(modelsMap.entries())
                    .map(([model, activeYearsSet]) => {
                        return {
                            package_name: model,
                            active_years: Array.from(activeYearsSet).sort((a, b) => b - a)
                        };
                    })
                    .filter(m => m.active_years.length > 0)
                    .sort((a, b) => trSortKey(a.package_name).localeCompare(trSortKey(b.package_name)));

                return {
                    brand: brand,
                    models: models
                };
            })
            .filter(b => b.models.length > 0)
            .sort((a, b) => trSortKey(a.brand).localeCompare(trSortKey(b.brand)));

        console.log(`Writing output to ${outputFile}...`);
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
        console.log("Successfully created vehicles.json!");

    } catch (error) {
        console.error("Error processing file:", error);
    }
}

processVehicles();
