const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Lidar com preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Fazer a requisição para o servidor de destino com timeout reduzido
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduzido para 3 segundos
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://google.com/'
        },
        signal: controller.signal,
        timeout: 3000
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`HTTP error: ${response.status}`);
        return res.status(response.status).json({ error: `HTTP error! status: ${response.status}` });
      }
      
      const data = await response.json();
      console.log(`Request successful for: ${url}`);
      return res.status(200).json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log(`Fetch error for ${url}: ${fetchError.message}`);
      
      // Tentar com um método alternativo
      try {
        console.log(`Trying alternative method for: ${url}`);
        const altResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'curl/7.68.0',
            'Accept': '*/*'
          },
          signal: controller.signal,
          timeout: 3000
        });
        
        clearTimeout(timeoutId);
        
        if (!altResponse.ok) {
          console.log(`Alternative method also failed: ${altResponse.status}`);
          return res.status(altResponse.status).json({ error: `HTTP error! status: ${altResponse.status}` });
        }
        
        const altData = await altResponse.json();
        console.log(`Alternative method successful for: ${url}`);
        return res.status(200).json(altData);
      } catch (altError) {
        clearTimeout(timeoutId);
        console.log(`Alternative method also failed for ${url}: ${altError.message}`);
        return res.status(500).json({ error: altError.message || 'Internal server error' });
      }
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
