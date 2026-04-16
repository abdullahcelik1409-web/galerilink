// Sahibinden Scraper for Galerilink (Final Solution v3)
console.log('%c[Galerilink Scraper] Aktif v3', 'color: #10b981; font-weight: bold;');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape_data') {
    try {
      const data = extractListingData();
      sendResponse(data);
    } catch (error) {
      console.error('[Galerilink Scraper] Hata:', error);
      sendResponse(null);
    }
  }
  return true;
});

function extractListingData() {
  const title = document.querySelector('.classifiedDetailTitle h1')?.innerText?.trim();
  const ilanNo = document.querySelector('#classifiedId')?.innerText?.trim();
  
  // 1. Fiyat Temizleme (Kesin Çözüm)
  const priceEl = document.querySelector('.classifiedInfo h3');
  let price = "";
  if (priceEl) {
    // Kredi teklifi vb. çocuk elementleri varsa onları dahil etme, sadece kendi text'ini al
    price = Array.from(priceEl.childNodes)
      .filter(node => node.nodeType === 3) // Text node
      .map(node => node.textContent.trim())
      .join('') || priceEl.innerText.split('\n')[0].trim();
  }
  
  // 2. Detay Listesini Tara
  const infoList = {};
  document.querySelectorAll('.classifiedInfoList li').forEach(li => {
    const label = li.querySelector('strong')?.innerText?.replace(':', '').trim();
    const value = li.querySelector('span')?.innerText?.trim();
    if (label && value) infoList[label] = value;
  });

  const year = parseInt(infoList['Yıl']) || 0;
  
  // KM Temizleme (Kesinleşmiş Seçici)
  const kmRaw = infoList['KM'] || infoList['Kilometre'] || "";
  const km = parseInt(kmRaw.replace(/\D/g, '')) || 0;
  
  // 2.1 Konum Bilgisi (İl / İlçe)
  const locationEl = document.querySelector('.classifiedInfo h2');
  let location_city = "";
  let location_district = "";
  
  if (locationEl) {
    const parts = locationEl.innerText.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      location_city = parts[0].toUpperCase('tr-TR');
      location_district = parts[1].toUpperCase('tr-TR');
    }
  }

  // 3. Resim URL'lerini Topla (Güçlendirildi)
  const imageUrls = [];
  // Hem thumb hem büyük resim seçicilerini genişlettik
  const allImages = document.querySelectorAll('img.thmbImg, img.stdImg, .classifiedDetailThumbList img, .classifiedDetailMainPhoto img');
  
  allImages.forEach(img => {
    let src = img.getAttribute('data-original') || 
              img.getAttribute('data-src') || 
              img.getAttribute('original-src') || 
              img.src;

    if (src && !src.includes('clear.gif') && !src.includes('blank.gif')) {
      // AVIF yerine JPG versiyonunu tercih et (daha güvenli lrg dönüşümü için)
      if (src.includes('.avif')) {
        src = src.replace('.avif', '.jpg');
      }
      
      // Çözünürlük yükseltme
      src = src.replace(/(thmb_|x5_|native_|thmb2_|x2_|x3_|x4_|stdImg_)/, 'lrg_');
      if (!imageUrls.includes(src)) imageUrls.push(src);
    }
  });

  // 4. İlan Açıklaması
  const description = document.querySelector('#classifiedDescription')?.innerText?.trim() || "";

  // 5. Ekspertiz Taraması (Grup Bazlı - Kesin Çözüm)
  const expertise = {};
  const partMapping = {
    'Ön Tampon': 'on_tampon', 'Kaput': 'on_kaput', 'Tavan': 'tavan',
    'Arka Tampon': 'arka_tampon', 'Bagaj': 'arka_bagaj',
    'Sol Ön Çamurluk': 'on_sol', 'Sol Ön Kapı': 'on_sol_kapi',
    'Sol Arka Kapı': 'arka_sol_kapi', 'Sol Arka Çamurluk': 'arka_sol',
    'Sağ Ön Çamurluk': 'on_sag', 'Sağ Ön Kapı': 'on_sag_kapi',
    'Sağ Arka Kapı': 'arka_sag_kapi', 'Sağ Arka Çamurluk': 'arka_sag'
  };

  // Sahibinden'in yeni şema yan listesi: .car-damage-info-list içindeki UL'ler
  const expertiseLists = document.querySelectorAll('.car-damage-info-list ul, .expertise-component ul');
  
  expertiseLists.forEach(ul => {
    // Listede hangi başlık var? (Boyalı mı? Değişen mi?)
    const titleEl = ul.querySelector('.pair-title');
    if (!titleEl) return;

    const titleText = titleEl.innerText.toLowerCase();
    let state = null;
    
    if (titleText.includes('değişen')) state = 'changed';
    else if (titleText.includes('lokal boyalı')) state = 'local_painted';
    else if (titleText.includes('boyalı')) state = 'painted';

    if (state) {
      // Sadece bu UL içindeki işaretli parçaları bul
      const parts = ul.querySelectorAll('.selected-damage');
      parts.forEach(p => {
        const partText = p.innerText.trim();
        Object.entries(partMapping).forEach(([key, val]) => {
          if (partText.toLowerCase().includes(key.toLowerCase())) {
            expertise[val] = state;
          }
        });
      });
    }
  });

  // 6. Marka/Model/Paket
  const breadcrumbs = Array.from(document.querySelectorAll('.breadcrumb li'))
    .map(li => li.innerText.trim())
    .filter(t => !['Anasayfa', 'Vasıta', 'Otomobil'].includes(t));

  const brand = breadcrumbs[0] || infoList['Marka'] || '';
  const model = breadcrumbs[1] || infoList['Model'] || '';
  const series = breadcrumbs[2] || infoList['Seri'] || '';

  return {
    title, ilanNo, brand, model, series, year, km, price,
    location_city, location_district,
    imageUrls: imageUrls.slice(0, 30),
    expertise,
    description,
    fuel: infoList['Yakıt'] || '',
    transmission: infoList['Vites'] || '',
    bodyType: infoList['Kasa Tipi'] || '',
    engineSize: infoList['Motor Hacmi'] || '',
    enginePower: infoList['Motor Gücü'] || '',
    url: window.location.href
  };
}
