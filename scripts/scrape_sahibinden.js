const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const { supabaseAdmin } = require('./utils/supabase-admin');
require('dotenv').config({ path: '.env.local' });

puppeteer.use(StealthPlugin());

const START_URL = 'https://www.sahibinden.com/otomobil';

// Human-like delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min = 2000, max = 5000) => delay(Math.floor(Math.random() * (max - min)) + min);

async function uploadLogoToStorage(brandName, imageUrl) {
  try {
    console.log(`Downloading logo for ${brandName}...`);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const fileName = `${brandName.toLowerCase().replace(/\s+/g, '-')}.png`;
    const filePath = `logos/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('brand_logos')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('brand_logos')
      .getPublicUrl(filePath);

    console.log(`Uploaded logo to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Logo processing failed for ${brandName}:`, error.message);
    return null;
  }
}

async function scrapeSahibinden() {
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true after debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('Bot başlatıldı. Ana sayfaya gidiliyor...');
    await page.goto(START_URL, { waitUntil: 'networkidle2' });
    await randomDelay(3000, 6000);

    // Get Brands and their logos from the category-list
    const brands = await page.evaluate(() => {
      // Sahibinden often uses images inside the category links or labels
      const items = Array.from(document.querySelectorAll('.category-list li'));
      return items.map(li => {
        const a = li.querySelector('a');
        const img = li.querySelector('img');
        if (!a) return null;
        return {
          name: a.textContent.trim(),
          url: a.href,
          slug: a.href.split('/').pop(),
          logoUrl: img ? img.src : null
        };
      }).filter(b => b && b.name && !['Otomobil', 'Tüm İlanlar'].includes(b.name));
    });

    console.log(`Toplam ${brands.length} marka bulundu.`);

    for (const brand of brands.slice(0, 15)) { // Test with first 15
      console.log(`-----------------------------------`);
      console.log(`İşleniyor: ${brand.name.toUpperCase()}`);
      
      let finalLogoUrl = null;
      if (brand.logoUrl) {
         finalLogoUrl = await uploadLogoToStorage(brand.name, brand.logoUrl);
      }

      // Upsert Brand with Logo
      const { data: dbBrand, error: brandErr } = await supabaseAdmin
        .from('car_taxonomy')
        .upsert({ 
          name: brand.name, 
          slug: brand.slug, 
          level: 'brand', 
          logo_url: finalLogoUrl,
          parent_id: null 
        }, { onConflict: 'name, level, parent_id' })
        .select()
        .single();

      if (brandErr) {
        console.error(`DB Error (Brand): ${brandErr.message}`);
        continue;
      }

      // Navigate to Brand Page to get Series
      console.log(`${brand.name} için seriler çekiliyor...`);
      await page.goto(brand.url, { waitUntil: 'networkidle2' });
      await randomDelay(2000, 4000);

      const seriesList = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.category-list li a'));
        return links.map(a => ({
          name: a.textContent.trim(),
          url: a.href,
          slug: a.href.split('/').pop()
        })).filter(s => s.name && s.url.includes('/otomobil-'));
      });

      for (const series of seriesList) {
        process.stdout.write(`  > Seri: ${series.name} `);
        await supabaseAdmin
          .from('car_taxonomy')
          .upsert({ 
            name: series.name, 
            slug: series.slug, 
            level: 'series', 
            parent_id: dbBrand.id 
          }, { onConflict: 'name, level, parent_id' });
      }
      console.log(`\n${brand.name} tamamlandı.`);
    }

  } catch (error) {
    console.error('Bot durduruldu:', error.message);
  } finally {
    await browser.close();
    console.log('Tüm işlemler bitti.');
  }
}

scrapeSahibinden();
