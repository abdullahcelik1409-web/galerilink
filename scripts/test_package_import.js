const axios = require('axios');

async function testPackageImport() {
  console.log("Paket (Model) kaydı test ediliyor...");
  try {
    const res = await axios.post('http://localhost:3000/api/taxonomy/import', {
      hierarchy: [
        { name: "Audi", level: "brand" },
        { name: "A3", level: "series" }
      ],
      children: ["1.6 TDI Comfortline", "1.5 TFSI Sport"],
      targetChildLevel: "package",
      filters: {}
    });
    console.log("API Response:", res.data);
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
  }
}

testPackageImport();
