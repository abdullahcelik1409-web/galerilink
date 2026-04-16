// Offscreen helper for image compression
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'offscreen' && message.action === 'compress') {
    compressImage(message.data)
      .then(sendResponse)
      .catch(err => {
        console.error('Compression error:', err);
        sendResponse(null);
      });
    return true;
  }
});

async function compressImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Target max resolution (e.g., 1280px width) while maintaining aspect ratio
      const maxWidth = 1200;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // WebP format with 0.8 quality
      const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);
      resolve(compressedDataUrl);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
