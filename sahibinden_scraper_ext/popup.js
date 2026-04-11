document.addEventListener('DOMContentLoaded', () => {
  const scrapeBtn = document.getElementById('scrapeBtn');
  const autoModeToggle = document.getElementById('autoModeToggle');
  const statusEl = document.getElementById('status');

  // Load current state
  chrome.storage.local.get(['autoMode'], (result) => {
    autoModeToggle.checked = !!result.autoMode;
  });

  // Handle toggle change
  autoModeToggle.addEventListener('change', () => {
    const isAuto = autoModeToggle.checked;
    chrome.storage.local.set({ autoMode: isAuto }, () => {
      showStatus(isAuto ? "✅ Otomatik mod açıldı. Sayfaları gezebilirsiniz." : "⚪ Otomatik mod kapatıldı.", isAuto ? "#059669" : "#666");
      
      // Update the content script immediately in the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggle_auto_mode", enabled: isAuto });
        }
      });
    });
  });

  scrapeBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes("sahibinden.com")) {
      showStatus("⚠️ Sadece Sahibinden üzerinde çalışır.", "red");
      return;
    }

    showStatus("⏳ Veriler çekiliyor...", "#2563eb");

    // 1. Step: Get data from content script
    chrome.tabs.sendMessage(tab.id, { action: "scrape_taxonomy" }, (scrapedData) => {
      if (chrome.runtime.lastError) {
        showStatus("❌ Sayfayı yenileyip tekrar deneyin.", "red");
        return;
      }

      if (!scrapedData || (!scrapedData.hierarchy?.length && !scrapedData.children?.length)) {
        showStatus("⚠️ Bu sayfada veri bulunamadı.", "orange");
        return;
      }

      // 2. Step: Send to background
      chrome.runtime.sendMessage({ action: "send_to_api", data: scrapedData }, (apiResponse) => {
        if (apiResponse && apiResponse.success) {
          showStatus(`✅ ${apiResponse.count} adet kategori kaydedildi!`, "#059669");
        } else {
          showStatus("❌ API Hatası: " + (apiResponse?.error || 'Bilinmiyor'), "red");
        }
      });
    });
  });

  function showStatus(msg, color) {
    statusEl.innerText = msg;
    statusEl.style.color = color;
    statusEl.style.display = "block";
    statusEl.style.background = color === 'red' ? '#fee2e2' : (color === '#059669' ? '#dcfce7' : '#f3f4f6');
  }
});
