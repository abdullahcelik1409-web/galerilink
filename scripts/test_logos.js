const axios = require('axios');

async function testLinks() {
  const links = [
    'https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg', // Modern Nissan
    'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png',     // Old Nissan
    'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg',    // Old Full Lion Peugeot
    'https://upload.wikimedia.org/wikipedia/en/e/e4/Peugeot_2021_logo.svg'     // New Shield Peugeot
  ];

  for(let l of links) {
    try {
      const res = await axios.head(l);
      console.log(l, "OK", res.status);
    } catch(e) {
      console.log(l, "FAIL", e.message);
    }
  }
}
testLinks();
