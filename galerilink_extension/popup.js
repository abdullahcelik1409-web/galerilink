document.addEventListener('DOMContentLoaded', () => {
  const mainView = document.getElementById('main-view');
  const settingsView = document.getElementById('settings-view');
  const importBtn = document.getElementById('import-btn');
  const showSettingsBtn = document.getElementById('show-settings');
  const hideSettingsBtn = document.getElementById('hide-settings');
  const saveSettingsBtn = document.getElementById('save-settings');
  const apiKeyInput = document.getElementById('api-key');
  const statusMsg = document.getElementById('status-msg');

  // Load API Key
  chrome.storage.local.get(['extensionKey'], (result) => {
    if (result.extensionKey) {
      apiKeyInput.value = result.extensionKey;
    } else {
      toggleView(true); // Show settings if no key
    }
  });

  function toggleView(showSettings) {
    mainView.style.display = showSettings ? 'none' : 'block';
    settingsView.style.display = showSettings ? 'block' : 'none';
  }

  function showStatus(text, type) {
    statusMsg.innerText = text;
    statusMsg.className = type;
    statusMsg.style.display = 'block';
    setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 5000);
  }

  showSettingsBtn.addEventListener('click', () => toggleView(true));
  hideSettingsBtn.addEventListener('click', () => toggleView(false));

  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus('Lütfen geçerli bir key girin.', 'error');
      return;
    }
    chrome.storage.local.set({ extensionKey: key }, () => {
      showStatus('Key başarıyla kaydedildi.', 'success');
      setTimeout(() => toggleView(false), 1000);
    });
  });

  importBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('sahibinden.com/ilan')) {
      showStatus('Sadece Sahibinden ilan sayfasında çalışır.', 'error');
      return;
    }

    importBtn.disabled = true;
    importBtn.innerText = 'Aktarılıyor...';
    
    // Check if key exists
    const { extensionKey } = await chrome.storage.local.get(['extensionKey']);
    if (!extensionKey) {
      showStatus('Hata: Ayarlardan Key girişi yapın.', 'error');
      importBtn.disabled = false;
      importBtn.innerText = 'Hemen Aktar';
      return;
    }

    // Dynamic Injection & Robust Messaging
    const scrapeData = async () => {
      try {
        // Try to communicate with existing script
        return await chrome.tabs.sendMessage(tab.id, { action: 'scrape_data' });
      } catch (e) {
        // If failed (context invalidated), inject content.js dynamically
        console.log('[Galerilink] Bağlantı kopuk, script enjekte ediliyor...');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        // Wait a small bit and try again
        await new Promise(r => setTimeout(r, 200));
        return await chrome.tabs.sendMessage(tab.id, { action: 'scrape_data' });
      }
    };

    try {
      const response = await scrapeData();
      
      if (!response) {
        showStatus('Veri okunamadı. İlan sayfasında olduğunuzdan emin olun.', 'error');
        resetBtn();
        return;
      }

      // Send to background for processing and upload
      chrome.runtime.sendMessage({ 
        action: 'process_and_upload', 
        data: response,
        extensionKey: extensionKey
      }, (result) => {
        if (result && result.success) {
          showStatus('Başarıyla Taslaklara Eklendi!', 'success');
        } else {
          showStatus('Hata: ' + (result?.error || 'Bilinmeyen hata'), 'error');
        }
        resetBtn();
      });
    } catch (err) {
      console.error(err);
      showStatus('Sistem hatası. Lütfen sayfayı yenileyip deneyin.', 'error');
      resetBtn();
    }
  });

  function resetBtn() {
    importBtn.disabled = false;
    importBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Hemen Aktar`;
  }
});
