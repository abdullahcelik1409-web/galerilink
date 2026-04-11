const axios = require('axios');

async function testNhtsaApi() {
  console.log("NHTSA API Araştırması Başlatılıyor...");
  
  try {
    // 1. Markaları Çek
    console.log("\n--- MARKALAR ---");
    const makesRes = await axios.get('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json');
    const brands = makesRes.data.Results.slice(0, 5); // İlk 5 markayı görelim
    console.log("Bulunan Marka Sayısı:", makesRes.data.Count);
    console.log("Örnek Markalar:", brands.map(b => b.MakeName).join(', '));

    // 2. Bir markanın (Örn: Audi) modellerini çek
    console.log("\n--- MODELLER (Audi Örneği) ---");
    const modelsRes = await axios.get('https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/Audi?format=json');
    const models = modelsRes.data.Results.slice(0, 10);
    console.log("Audi Modelleri (Serileri):", models.map(m => m.Model_Name).join(', '));

  } catch (err) {
    console.error("API Hatası:", err.message);
  }
}

testNhtsaApi();
