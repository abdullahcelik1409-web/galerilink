// Sahibinden Taxonomy Scraper - Content Script
// Sahibinden'un gerçek DOM yapısına göre yazılmıştır

let autoModeEnabled = false;
let lastScrapedUrl = "";
let lastPayloadHash = ""; // Mükerrer gönderimi önlemek için

// Check auto mode on startup
chrome.storage.local.get(['autoMode'], (result) => {
  autoModeEnabled = !!result.autoMode;
  if (autoModeEnabled) {
    console.log("[Taxonomy Scraper] Otomatik mod aktif, dinamik tarama başlıyor...");
    initAutoScrape();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape_taxonomy") {
    try {
      const data = extractSahibindenData();
      lastScrapedUrl = window.location.href;
      console.log("[Taxonomy Scraper] Manuel çekilen veri:", data);
      sendResponse(data);
    } catch (error) {
      console.error("[Taxonomy Scraper] Manuel çekim hatası:", error);
      sendResponse(null);
    }
  }
  
  if (request.action === "toggle_auto_mode") {
    autoModeEnabled = request.enabled;
    console.log("[Taxonomy Scraper] Otomatik mod durumu:", autoModeEnabled);
    if (autoModeEnabled) initAutoScrape();
  }
});

let debounceTimer;
function initAutoScrape() {
  console.log("[Taxonomy Scraper] Dinamik izleyici (Observer) başlatıldı.");

  // 1. URL DEĞİŞİMİ İÇİN PERİYODİK KONTROL
  const urlCheck = setInterval(() => {
    if (!autoModeEnabled) {
      clearInterval(urlCheck);
      return;
    }
    if (window.location.href !== lastScrapedUrl) {
      triggerScrape("URL_CHANGE");
    }
  }, 2000);

  // 2. SAYFA İÇİ DEĞİŞİMLER İÇİN OBSERVER (Üzerinde gezince açılan menüler vb.)
  const observer = new MutationObserver(() => {
    if (!autoModeEnabled) {
      observer.disconnect();
      return;
    }
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      triggerScrape("DOM_CHANGE");
    }, 1500); // 1.5 saniye bekle (kullanıcı gezinmeyi bitirsin)
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function triggerScrape(reason) {
  if (!autoModeEnabled) return;
  if (window.location.pathname.includes('/ilan/')) return;

  try {
    const data = extractSahibindenData();
    
    // Veri var mı ve hiyerarşi/çocuklardan en az biri dolu mu?
    if (data && (data.hierarchy.length > 0 || data.children.length > 0)) {
       // Mükerrer gönderimi önlemek için veriyi hash'le (basit stringify karşılaştırması)
       const currentHash = JSON.stringify({ h: data.hierarchy, c: data.children });
       
       if (currentHash !== lastPayloadHash) {
         lastPayloadHash = currentHash;
         lastScrapedUrl = window.location.href;
         
         console.log(`[Taxonomy Scraper] Tetiklendi (${reason}):`, lastScrapedUrl);
         console.log(`[Taxonomy Scraper] Bulunan veri: ${data.hierarchy.length} hiyerarşi, ${data.children.length} çocuk.`);

         chrome.runtime.sendMessage({ action: "send_to_api", data: data }, (response) => {
           console.log("[Taxonomy Scraper] API Yanıtı:", response);
         });
       }
    }
  } catch (err) {
    console.error("[Taxonomy Scraper] Tarama hatası:", err);
  }
}

function extractSahibindenData() {
  const path = window.location.pathname;
  let hierarchy = [];
  const levels = ['brand', 'series', 'fuel', 'body', 'transmission', 'engine', 'package'];
  
  // Sözlük: Hangi kelime hangi seviyeye (level) girer?
  const LEVEL_MAPPER = {
    fuel: ["TDI", "TFSI", "TSI", "GDI", "VTEC", "D4D", "CRDi", "CDTI", "BlueHDi", "MultiJet", "EcoBoost", "Hybrid", "Hibrit", "Dizel", "Benzin", "Elektrik", "LPG"],
    body: ["Sedan", "Hatchback", "HB", "Avant", "Estate", "SUV", "Coupe", "Cabrio", "Station Wagon", "SW", "MPV", "Roadster", "Pick-up"],
    transmission: ["Otomatik", "Manuel", "DSG", "S-Tronic", "EDC", "Tiptronic", "Yarı Otomatik", "CVT"]
  };

  function getSmartLevel(name, index) {
    if (index === 0) return 'brand';
    if (index === 1) return 'series';
    
    // Kelime bazlı kontrol
    const upperName = name.toUpperCase();
    for (const [level, keywords] of Object.entries(LEVEL_MAPPER)) {
      if (keywords.some(key => upperName.includes(key.toUpperCase()))) {
        return level;
      }
    }
    
    return 'package'; // Varsayılan güvenli seviye
  }

  try {
    // 1. ÖNCELİK: Sahibinden'un sayfaya gömdüğü tracking verisi (En güvenilir olan)
    const trackingJson = document.getElementById('gaPageViewTrackingJson');
    if (trackingJson && trackingJson.textContent && trackingJson.textContent.trim()) {
      const data = JSON.parse(trackingJson.textContent);
      if (data && data.categories && Array.isArray(data.categories)) {
        const filteredCats = data.categories.filter(c => 
          c && typeof c === 'string' &&
          !["Vasıta", "Otomobil", "Kategori", "Anasayfa"].includes(c.trim())
        );
        
        filteredCats.forEach((catName, index) => {
          hierarchy.push({ 
            name: catName.trim(), 
            level: getSmartLevel(catName.trim(), index) 
          });
        });
        console.log("[Taxonomy Scraper] JSON'dan çekilen hiyerarşi:", hierarchy);
      }
    }
  } catch (err) {
    console.warn("[Taxonomy Scraper] JSON okunurken hata:", err.message);
  }

  // 2. ÖNCELİK: Breadcrumb elementleri (Eğer JSON yoksa veya boşsa)
  if (hierarchy.length === 0) {
    console.log("[Taxonomy Scraper] JSON bulunamadı, Breadcrumb deneniyor...");
    const breedcrumbSelectors = [
      '.breadcrumb li', 
      'ul.category-list li.breadcrumb-item', 
      '.uiInlineBoxContent .category-list li', 
      '.breadcrumbContainer li',
      '.top-breadcrumb-links li'
    ];
    let elements = [];
    for (const sel of breedcrumbSelectors) {
      elements = document.querySelectorAll(sel);
      if (elements.length > 0) break;
    }

    if (elements.length > 0) {
      const breadcrumbTexts = Array.from(elements)
        .map(el => el.innerText.trim())
        .filter(text => text && !["Vasıta", "Otomobil", "Anasayfa", "İkinci El", "Kategori"].includes(text));
      
      breadcrumbTexts.forEach((text, index) => {
        hierarchy.push({ 
          name: text, 
          level: getSmartLevel(text, index) 
        });
      });
    }
  }

  // 3. SON ÇARE: URL segmentleri
  if (hierarchy.length === 0) {
    const urlSegments = path.split('/').filter(s => s && !['kategori', 'otomobil', 'vasita', 'vasıta', 'ikinci-el'].includes(s));
    if (urlSegments.length > 0) {
      urlSegments.forEach((segment, index) => {
        let name = decodeURIComponent(segment);
        name = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        hierarchy.push({ 
          name: name, 
          level: getSmartLevel(name, index) 
        });
      });
    }
  }

  // --- AKILLI HİYERARŞİ DÜZELTME (Marka-Seri Ayrımı) ---
  const KNOWN_BRANDS = ["Alfa Romeo", "Aston Martin", "Mercedes-Benz", "Land Rover", "Range Rover", "Audi", "Bmw", "BMW", "Byd", "BYD", "Chery", "Chevrolet", "Citroen", "Cupra", "Dacia", "Ford", "Honda", "Hyundai", "Toyota", "Volkswagen", "Fiat", "Nissan", "Peugeot", "Renault", "Dodge", "Ds", "DS", "Ferrari", "Jaguar", "Kia", "Lamborghini", "Lancia", "Lexus", "Maserati", "Mazda", "Mercedes", "MG", "Mini", "Mitsubishi", "Opel", "Porsche", "Seat", "Skoda", "Smart", "Subaru", "Suzuki", "Tesla", "Tofaş", "Volvo"];

  if (hierarchy.length === 1 && hierarchy[0].level === 'brand') {
    const fullName = hierarchy[0].name;
    const matchedBrand = KNOWN_BRANDS.find(b => fullName.toLowerCase().startsWith(b.toLowerCase()));
    
    if (matchedBrand && fullName.length > matchedBrand.length) {
      const brandPart = fullName.substring(0, matchedBrand.length).trim();
      const remainingPart = fullName.substring(matchedBrand.length).trim();
      
      if (remainingPart) {
         console.log(`[Taxonomy Scraper] Birleşik hiyerarşi ayrılıyor: "${fullName}" -> [${brandPart}] + [${remainingPart}]`);
         hierarchy = [
           { name: brandPart, level: 'brand' },
           { name: remainingPart, level: 'series' }
         ];
      }
    }
  }

  // --- UNIVERSAL KATEGORİ BULUCU (En çok veri içeren listeyi bulur) ---
  const subCategories = [];
  const selectors = [
    'ul.sub-categories li:not(.all-categories)', 
    'ul.categoryListUl li', 
    '.category-list li', 
    '.search-category-container li', 
    '.faceted-select[data-name="model"] li',
    '.faceted-select[data-name="package"] li',
    '.faceted-select li',
    '.uiInlineBoxContent ul li',
    '.uiInlineBoxContent .category-list li',
    '.category-list-container li',
    '.cl2 li', // Sahibinden'in bazı listelerinde kullanılan kısa class
    '.cl3 li'
  ];

  let bestList = [];
  let maxCount = 0;

  for (const sel of selectors) {
    const found = document.querySelectorAll(sel);
    if (found.length > 0) {
      let validCount = 0;
      const currentList = [];
      
      found.forEach(el => {
        const link = el.querySelector('a');
        let text = link ? link.innerText || link.textContent : el.innerText || el.textContent;
        if (text) {
          text = text.split('(')[0].split('\n')[0].trim();
          if (text && text.length > 1 && !text.match(/^[\d.,]+$/) && !["Tümü", "Kategori", "Filtrele", "Geri", "Kapat", "Anasayfa"].includes(text)) {
            validCount++;
            currentList.push(text);
          }
        }
      });

      // En çok geçerli eleman içeren listeyi "gerçek" kategori listesi kabul et
      if (validCount > maxCount) {
        maxCount = validCount;
        bestList = currentList;
      }
    }
  }

  // Mükerrerleri temizleyerek subCategories'e ekle
  bestList.forEach(text => {
    const lastLevelName = hierarchy.length > 0 ? hierarchy[hierarchy.length - 1].name.toLowerCase() : "";
    if (text.toLowerCase() !== lastLevelName && !subCategories.includes(text)) {
      subCategories.push(text);
    }
  });
  // -------------------------------------------------------------

  const targetChildLevel = levels[hierarchy.length] || 'package';
  const result = {
    hierarchy,
    children: subCategories,
    filters: {},
    targetChildLevel,
    pageUrl: window.location.href,
    pageTitle: document.title
  };

  if (subCategories.length > 0) {
    console.log(`[Taxonomy Scraper] ${subCategories.length} adet alt kategori (Model/Paket) yakalandı.`);
  }

  console.log("[Taxonomy Scraper] API'ye gönderilecek veri (Akıllı Eşleşme):", JSON.stringify(result, null, 2));
  return result;
}
