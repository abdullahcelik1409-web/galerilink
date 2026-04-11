// Background Service Worker - API iletişimini burada yapıyoruz
// Content script -> Service Worker -> localhost API

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "send_to_api") {
    const data = message.data;
    
    console.log("[Taxonomy BG] API'ye gönderiliyor:", data);

    fetch("http://localhost:3000/api/taxonomy/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
      console.log("[Taxonomy BG] API yanıtı:", result);
      sendResponse({ success: true, count: result.count || 0 });
    })
    .catch(err => {
      console.error("[Taxonomy BG] API hatası:", err);
      sendResponse({ success: false, error: err.message });
    });

    return true; // async response için kanalı açık tut
  }
});
