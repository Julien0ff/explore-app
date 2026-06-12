const fetch = require('cross-fetch');
fetch('https://html.duckduckgo.com/html/?q=test', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
}).then(res => res.text()).then(html => {
  console.log("Length:", html.length);
  console.log("Has .result__snippet:", html.includes('result__snippet'));
  console.log("Has .result-snippet:", html.includes('result-snippet'));
}).catch(console.error);
