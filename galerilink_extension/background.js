// Galerilink Background Service Worker
// Supabase API iletişimini doğrudan fetch ile yapar

const SUPABASE_URL = 'https://xqivvgnzrikwcavcxjsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaXZ2Z256cmlrd2NhdmN4anNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjAyMTQsImV4cCI6MjA5MDYzNjIxNH0.yyDP-4S-ODwV_XDcw8hAOOO0AEDBrlOPva_dgyzmZ9A';

let creating; // Global variable to track offscreen creation promise

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'process_and_upload') {
    handleProcess(message.data, message.extensionKey)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; 
  }
});

async function handleProcess(data, extensionKey) {
  console.log('[Galerilink] Veri işleme başladı:', data.ilanNo);
  
  // 1. Resim İşleme ve Upload
  const uploadedUrls = [];
  const targetImages = data.imageUrls || [];
  
  if (targetImages.length === 0) {
    console.warn('[Galerilink] Hiç resim bulunamadı.');
  }

  // Resimleri paralel ama limitli işle (darboğaz olmasın)
  const processPromises = targetImages.map(async (imgUrl) => {
    try {
      console.log('[Galerilink] Resim işleniyor:', imgUrl);
      const webpBlob = await processImage(imgUrl);
      if (webpBlob) {
        const publicUrl = await uploadToStorage(webpBlob, 'ext'); 
        return publicUrl;
      }
    } catch (e) {
      console.error('[Galerilink] Resim işleme hatası:', imgUrl, e);
    }
    return null;
  });

  const results = await Promise.all(processPromises);
  results.forEach(url => {
    if (url) uploadedUrls.push(url);
  });

  // 2. Taslak Kaydı
  console.log('[Galerilink] Taslak kaydediliyor, resim sayısı:', uploadedUrls.length);
  await callInsertRPC(extensionKey, {
    ...data,
    images: uploadedUrls
  });

  return { ilanNo: data.ilanNo };
}

async function callInsertRPC(key, draftData) {
  const payload = {
    key_input: key,
    draft_data: {
      ilan_no: draftData.ilanNo,
      title: draftData.title,
      brand: draftData.brand,
      model: draftData.model,
      series: draftData.series,
      year: draftData.year,
      km: draftData.km,
      price: draftData.price,
      expertise: draftData.expertise,
      images: draftData.images,
      description: draftData.description,
      fuel: draftData.fuel,
      transmission: draftData.transmission,
      body_type: draftData.bodyType,
      engine_size: draftData.engineSize,
      engine_power: draftData.enginePower,
      location_city: draftData.location_city,
      location_district: draftData.location_district
    }
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_car_draft_with_key`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'API Hatası' }));
    console.error('[Galerilink] RPC Hatası:', err);
    throw new Error(err.message || 'Taslak kaydedilemedi.');
  }
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (creating) {
    await creating;
  } else {
    creating = (async () => {
      try {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['DOM_PARSER'],
          justification: 'Resim sıkıştırırma işlemi için canvas gereklidir.'
        });
        console.log('[Offscreen] Başarıyla oluşturuldu.');
      } catch (err) {
        if (!err.message.includes('Only a single offscreen document')) {
          console.error('[Offscreen] Oluşturma hatası:', err);
          throw err;
        }
        console.log('[Offscreen] Zaten mevcut, devam ediliyor.');
      }
    })();
    await creating;
    creating = null;
  }
}

// Resim İşleme Pipeline (Offscreen Document)
async function processImage(url) {
  try {
    console.log('[Resim İşlem] Başladı:', url);
    await setupOffscreenDocument();

    // Sahibinden engeline takılmamak için header ekleme işini rules.json (DNR) yapıyor.
    let response = await fetch(url);
    
    // Fallback: lrg_ bulunamazsa thmb_ veya x5_ dene
    if (!response.ok && url.includes('lrg_')) {
      for (const fallback of ['x5_', 'thmb_']) {
        const fallbackUrl = url.replace('lrg_', fallback);
        console.warn(`[Resim İşlem] lrg_ 404, denenen fallback: ${fallbackUrl}`);
        response = await fetch(fallbackUrl);
        if (response.ok) break;
      }
    }

    if (!response.ok) {
      throw new Error(`İndirme Hatası: ${response.status}`);
    }
    
    const blob = await response.blob();
    const reader = new FileReader();
    
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('FileReader hatası'));
      reader.readAsDataURL(blob);
    });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Compression Timeout')), 20000));
    const compressionPromise = chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'compress',
      data: dataUrl
    });

    const compressed = await Promise.race([compressionPromise, timeoutPromise]);

    if (!compressed) throw new Error('Sıkıştırma başarısız');

    const byteString = atob(compressed.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: 'image/webp' });
  } catch (err) {
    console.error(`[Resim İşlem] Hata (${url}):`, err.message);
    return null;
  }
}
async function uploadToStorage(blob, sellerId) {
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
  const path = `cars/${fileName}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/car_images/${path}`;
  
  console.log('[Upload] Başlıyor:', path);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'image/webp'
    },
    body: blob
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Upload] Supabase Hatası:', errorText, 'Path:', path);
    throw new Error(`Upload Failed: ${response.status} - ${errorText}`);
  }

  const resultUrl = `${SUPABASE_URL}/storage/v1/object/public/car_images/${path}`;
  console.log('[Upload] Tamamlandı:', resultUrl);
  return resultUrl;
}

async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(c => c.url.includes('offscreen.html'));
}
