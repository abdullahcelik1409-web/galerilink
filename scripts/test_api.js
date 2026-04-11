const axios = require('axios');

async function testArabamApi() {
  console.log("Arabam.com API test ediliyor...");
  try {
    // Arabam.com anasayfasından dönen veriyi veya bilinen bir endpointi deneyelim
    // Mobil uygulamaların kullandığı gateway'ler genelde daha esnektir.
    const res = await axios.get('https://www.arabam.com/category/get-all-categories', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
      }
    });
    console.log("Response Type:", typeof res.data);
    console.log("Status:", res.status);
    
    // Gelen verinin bir kısmını ekrana basalım
    if (res.data) {
       console.log(JSON.stringify(res.data).substring(0, 500));
    }
  } catch (error) {
    if (error.response) {
      console.log("API Error:", error.response.status, error.response.statusText);
      console.log("Response Data:", typeof error.response.data === 'string' ? error.response.data.substring(0, 100) : error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
}

testArabamApi();
